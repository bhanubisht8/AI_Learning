document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();

    let username = document.getElementById("username").value.trim();
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();
    let errorMsg = document.getElementById("errorMsg");

    errorMsg.textContent = "";

    // Gmail validation regex (must end with @gmail.com)
    let gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (username === "" || email === "" || password === "") {
        errorMsg.textContent = "All fields are required!";
        return;
    }

    if (!gmailPattern.test(email)) {
        errorMsg.textContent = "Email must be a valid Gmail address (example@gmail.com)";
        return;
    }

    if (password.length < 6) {
        errorMsg.textContent = "Password must be at least 6 characters!";
        return;
    }

    // Success (demo)
    alert("Login successful!");
});