# Engineering Design Document: Secure SSL VPN Infrastructure
**Project:** CCTNS NOC Secure Access Layer  
**Subject:** RADIUS-Driven Static Addressing & LDAPS Identity Management  
**Version:** 1.2  
**Author:** Network Infrastructure Specialist  

---

## 1. Executive Summary

### 1.1 Problem Statement
The CCTNS NOC infrastructure requires a scalable, secure, and highly traceable remote access solution for over 3,000 police stations. The core technical challenges involve:
*   **Traceability Requirements:** Every remote station must be assigned a persistent, static internal IP address to ensure compatibility with backend database applications and for precise forensic auditing.
*   **Identity Management:** Managing thousands of unique credentials manually on a hardware appliance is operationally unsustainable.
*   **Security Compliance:** Password lifecycle management must be encrypted and support self-service to minimize NOC administrative overhead.

### 1.2 Our Approach
We have implemented a **Decoupled Architecture** leveraging Windows Server 2019 and Fortinet FortiGate 201E. By separating the Authentication, Authorization, and Accounting (AAA) functions, we created a robust ecosystem:
*   **Identity Layer (Active Directory):** Serves as the single source of truth for all station credentials.
*   **Addressing Layer (NPS/RADIUS):** Acts as the attribute injection engine, ensuring each authenticated user receives a deterministic IP via the `Framed-IP-Address` attribute.
*   **Security Layer (LDAPS):** Provides an encrypted tunnel (Port 636) for secure directory queries and self-service password renewals.

### 1.3 Why AD-Integrated instead of Firewall-Only Certificates?
While issuing SSL VPN certificates directly from the FortiGate (Local CA) is technically possible, it was rejected for the following engineering reasons:
1.  **Operational Scalability:** Managing 3,000+ individual certificates and their lifecycles (issuance, expiration, renewal) on a firewall is impossible at scale. AD allows for mass user management via Security Groups.
2.  **Attribute Injection:** Standalone certificates cannot natively communicate with a RADIUS engine to assign static IPs per user. RADIUS is required to achieve the project's static addressing goal.
3.  **Centralized Revocation:** In the event of a security breach, a station's access can be revoked instantly by disabling a single AD account, rather than the complex process of updating and propagating Certificate Revocation Lists (CRLs).
4.  **Self-Service Management:** Using AD + LDAP allows stations to reset their own passwords via secure protocols, a feature not natively supported by basic firewall certificate management.

---

## 2. Solution Architecture
The architecture utilizes a "Hybrid Authentication Flow" to balance protocol strengths:
*   **Data Plane (RADIUS/NPS):** Handles primary authentication and attribute injection (Static IP).
*   **Management Plane (LDAPS):** Handles secure directory queries and password change operations.

### 2.1 Logical Flow Diagram
```text
[ Remote Client ] ----(SSL/443)----> [ FortiGate 201E ]
                                           |
               +---------------------------+---------------------------+
               | (Auth & Static IP)                                    | (Password Mgmt)
               v                                                       v
     [ Windows NPS/RADIUS ]                                  [ Windows AD DS / CS ]
     (Attribute: Framed-IP)                                  (Protocol: LDAPS/636)
```

---

## 3. Implementation Phase I: Identity & Access Management (IAM)

### 3.1 Directory Services & NPS Registration
1.  **Server Provisioning:** Deploy Windows Server 2019 with a static IP (`10.234.2.121`).
2.  **Domain Controller:** Promote to `cctnsnoc.local`.
3.  **NPS Activation:** Install Network Policy Server and **Register in Active Directory** to permit the reading of user dial-in properties.

### 3.2 Security Group Logic
Create a centralized Security Group `SG_SSL_VPN_Users`. All authorization policies will be scoped to this group to ensure the Principle of Least Privilege (PoLP).

---

## 4. Implementation Phase II: Deterministic Addressing (Static IP)

### 4.1 User-Level IP Mapping
For each critical node (e.g., LKO_Station_01), configure the **Dial-in** properties:
*   **Network Access Permission:** Allow Access.
*   **Static IP Address:** Assign unique IPv4 (e.g., `10.10.10.51`).

### 4.2 NPS Policy Configuration
Create a "Fortinet VPN Policy" in NPS:
*   **Conditions:** Windows Groups matches `SG_SSL_VPN_Users` AND NAS-IPv4 matches `Firewall_Internal_IP`.
*   **Settings:** Ensure **Framed-IP-Address** is included in the Standard attributes of the Access-Accept packet.

---

## 5. Implementation Phase III: Secure LDAP (LDAPS)

### 5.1 Certificate Authority (AD CS) Setup
Standard LDAP (389) is insecure and blocks password changes. LDAPS (636) is required.
1.  **CA Deployment:** Install AD Certificate Services as an **Enterprise Root CA**.
2.  **DC Certificate Template:** 
    *   Duplicate "Domain Controller Authentication".
    *   Enable **Server Authentication** and **Client Authentication**.
    *   Enroll the Domain Controller to bind the certificate to the LDAP service.

### 5.2 FortiGate Integration
1.  **Root CA Import:** Export the Base-64 Root CA and import it to FortiGate as a `CA_Cert`.
2.  **LDAP Object Configuration:**
```bash
config user ldap
    edit "CCTNSAD_LDAP"
        set server "10.234.2.121"
        set server-identitiy "adserver.cctnsnoc.local"
        set dn "DC=cctnsad,DC=local"
        set type regular
        set username "administrator@cctnsad.local"
        set secure ldaps
        set port 636
        set password-renewal enable
    next
end
```

---

## 6. FortiOS Security Gateway Configuration

### 6.1 Authentication Servers
Define the RADIUS server to bridge the Firewall and NPS:
```bash
config user radius
    edit "NPS_Radius"
        set server "10.234.2.121"
        set secret "ENCRYPTED_SHARED_SECRET"
    next
end
```

### 6.2 SSL-VPN Policy Enforcement
*   **Authentication Rule:** Map `NPS_Radius` to the `Police_Station_Portal`.
*   **Firewall Policy:** Create a policy allowing traffic from the `SSL_VPN_IP_Pool` to `Internal_Resources`.

---

## 7. Critical Protocol Observations & Troubleshooting

### 7.1 Protocol Limitations (The "Final Truth")
In a production Fortinet environment, **RADIUS and LDAP do not chain for a single login session.**
*   If the user authenticates via **RADIUS**, the password-renewal (LDAP) feature is bypassed.
*   **Specialist Recommendation:** For production, use an IIS-based web portal for password changes. Only use the LDAP VPN flow for specific management users who do not require static IPs.

---

## 8. Conclusion
The infrastructure is successfully configured to provide high-security access with guaranteed IP persistence. This design ensures that all traffic from CCTNS remote stations is traceable and that the identity management layer is encrypted via LDAPS.

**Approval:**  
*Network Specialist*  
*CCTNS NOC Team*
