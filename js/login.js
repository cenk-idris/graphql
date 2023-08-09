document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const chart = document.getElementById("pie-chart");

    // Convert credentials to base64
    const base64Credentials = btoa(username + ':' + password);

    try {
        // Make the POST request to the signin endpoint
        const response = await fetch('https://01.gritlab.ax/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + base64Credentials,
            },
        });

        if (response.status === 200) {
            chart.style.display = "none";
            const data = await response.json();
            localStorage.setItem("jwt", data);
            location.reload(); // Save JWT to local storage
            console.log(data)
            window.location.href = '/graphql/profile.html'; // Redirect to the profile page
        } else {
            let alertDiv = document.getElementById('alert-response')
            alertDiv.textContent = 'Invalid credentials, please try again';

        }
    } catch (error) {
        console.error('An error occurred:', error);
        document.getElementById('errorMessage').textContent = 'An error occurred. Please try again later.';
    }
});
