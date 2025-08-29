const backendURL = 'http://localhost:5000/api';

// Login API
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = document.getElementById('userId').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        if (!userId || !password || !role) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const res = await fetch(`${backendURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password, role })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('userId', data.user.userId);
                localStorage.setItem('userName', data.user.name);

                // Redirect based on role
                switch(data.user.role) {
                    case 'admin':
                        window.location.href = 'adminDashboard.html';
                        break;
                    case 'teacher':
                        window.location.href = 'teacherDashboard.html';
                        break;
                    case 'student':
                        window.location.href = 'studentDashboard.html';
                        break;
                    default:
                        alert('Invalid role');
                }
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Something went wrong. Please try again.');
        }
    });
}

// Check authentication status
function checkAuth() {
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
}

// Add auth check to protected pages
if (window.location.pathname.includes('Dashboard')) {
    checkAuth();
}

// Student Registration API
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(registerForm);

        try {
            const res = await fetch(`${backendURL}/auth/register/student`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                alert('Registered Successfully! Wait for teacher approval.');
                window.location.href = 'login.html';
            } else {
                alert(data.msg || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Something went wrong');
        }
    });
}
