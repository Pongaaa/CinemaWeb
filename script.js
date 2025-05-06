document.addEventListener('DOMContentLoaded', () => {        
// Không cần khai báo movies/users ở đây nữa
    let movies = [];
    let currentUser = null;

    // DOM Elements
    const moviesGrid = document.getElementById('movies-grid');
    const bookingModal = document.getElementById('booking-modal');
    const modalClose = document.querySelector('.close');
    const modalMovieTitle = document.getElementById('modal-movie-title');
    const seatsGrid = document.getElementById('seats-grid');
    const adultCount = document.getElementById('adult-count');
    const adultTotal = document.getElementById('adult-total');
    const totalPrice = document.getElementById('total-price');
    const bookTicketsBtn = document.getElementById('book-tickets-btn');
    const confirmationMessage = document.getElementById('confirmation-message');
    const bookingReference = document.getElementById('booking-reference');

    // Navigation elements
    const homeLink = document.getElementById('home-link');
    const moviesLink = document.getElementById('movies-link');
    const accountLink = document.getElementById('account-link');
    const moviesSection = document.getElementById('movies-section');
    const accountSection = document.getElementById('account-section');

    // Account elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const userDashboard = document.getElementById('user-dashboard');
    const registerToggle = document.getElementById('register-toggle');
    const loginToggle = document.getElementById('login-toggle');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userName = document.getElementById('user-name');
    const bookingsList = document.getElementById('bookings-list');

    // Admin panel
    const adminPanel = document.createElement('div');
    adminPanel.id = 'admin-panel';
    document.body.appendChild(adminPanel);

    // Initialize
    async function init() {
        await fetchMovies(); // Lấy phim từ API
        setupSeats();
        setupEventListeners();
        checkLoggedInUser();
    }

    // Lấy danh sách phim từ API
    async function fetchMovies() {
        const response = await fetch('http://localhost:3000/api/movies');
        movies = await response.json();
        populateMovies();
    }

    // Populate movies grid
    function populateMovies() {
        moviesGrid.innerHTML = '';
        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.innerHTML = `
                <div class="movie-poster" style="background-image: url('${movie.poster}')"></div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <p class="movie-details">${movie.duration} | ${movie.genre} | ${movie.rating}</p>
                    <button class="book-btn" data-movie-id="${movie._id}">Book Now</button>
                    ${currentUser?.role === 'admin' ? `
                        <button class="edit-movie-btn" data-movie-id="${movie._id}">Edit</button>
                        <button class="delete-movie-btn" data-movie-id="${movie._id}">Delete</button>
                    ` : ''}
                </div>
            `;
            moviesGrid.appendChild(movieCard);
        });
    }

    // Setup admin panel
    function setupAdminPanel() {
        if (!currentUser || currentUser.role !== 'admin') return;
        
        adminPanel.innerHTML = `
            <h2>Admin Panel</h2>
            <button id="add-movie-btn">Add New Movie</button>
            <div id="movie-form-container" style="display: none;">
                <form id="movie-form">
                    <input type="text" id="movie-title-input" placeholder="Title" required>
                    <input type="text" id="movie-poster-input" placeholder="Poster URL" required>
                    <input type="text" id="movie-duration-input" placeholder="Duration" required>
                    <input type="text" id="movie-genre-input" placeholder="Genre" required>
                    <input type="text" id="movie-rating-input" placeholder="Rating" required>
                    <input type="text" id="movie-showtimes-input" placeholder="Showtimes (comma separated)">
                    <button type="submit">Save Movie</button>
                </form>
            </div>
        `;
    }

    // Handle login
    async function handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (response.ok) {
                currentUser = await response.json();
                localStorage.setItem('currentUserId', currentUser._id);
                updateUserDashboard();
                showUserDashboard();
                if (currentUser.role === 'admin') {
                    setupAdminPanel();
                    adminPanel.style.display = 'block';
                }
                populateMovies();
            } else {
                const errorData = await response.json();
                alert(`Login failed: ${errorData.error || 'Invalid email or password'}`);
            }
        } catch (err) {
            alert(`Error connecting to server: ${err.message}`);
        }
    }

    // Handle registration
    async function handleRegister() {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        
        try {
            const response = await fetch('http://localhost:3000/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role: 'user', bookings: [] })
            });
            
            if (response.ok) {
                currentUser = await response.json();
                localStorage.setItem('currentUserId', currentUser._id);
                updateUserDashboard();
                showUserDashboard();
            } else {
                const errorData = await response.json();
                alert(`Registration failed: ${errorData.error || 'Unknown error'}`);
            }
        } catch (err) {
            alert(`Error connecting to server: ${err.message}`);
        }
    }

    // Admin: Add/Edit Movie
    async function handleMovieFormSubmit(e) {
        e.preventDefault();
        const movieData = {
            title: document.getElementById('movie-title-input').value,
            poster: document.getElementById('movie-poster-input').value,
            duration: document.getElementById('movie-duration-input').value,
            genre: document.getElementById('movie-genre-input').value,
            rating: document.getElementById('movie-rating-input').value,
            showtimes: document.getElementById('movie-showtimes-input').value.split(',').map(s => s.trim())
        };

        const movieId = document.getElementById('movie-form').dataset.movieId;
        const method = movieId ? 'PUT' : 'POST';
        const url = movieId ? `http://localhost:3000/api/movies/${movieId}` : 'http://localhost:3000/api/movies';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movieData)
        });
        
        await fetchMovies();
        document.getElementById('movie-form-container').style.display = 'none';
    }

    // Admin: Delete Movie
    async function deleteMovie(movieId) {
        await fetch(`http://localhost:3000/api/movies/${movieId}`, { method: 'DELETE' });
        await fetchMovies();
    }

    // Handle book tickets
    async function handleBookTickets() {
        if (!currentUser) {
            alert('Please login to book tickets');
            navigateTo('account');
            return;
        }
        
        const selectedSeats = document.querySelectorAll('.seat.selected');
        if (selectedSeats.length === 0) {
            alert('Please select at least one seat');
            return;
        }
        
        const seatIds = Array.from(selectedSeats).map(seat => seat.dataset.seatId);
        const total = selectedSeats.length * 12;
        const showtime = document.getElementById('showtime-select').value;
        const bookingRef = 'CW' + Math.floor(10000 + Math.random() * 90000);
        
        const booking = {
            id: bookingRef,
            movie: modalMovieTitle.textContent,
            showtime,
            seats: seatIds,
            total
        };

        // Cập nhật booking vào database
        await fetch(`http://localhost:3000/api/users/${currentUser._id}/bookings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking })
        });

        // Cập nhật currentUser
        const response = await fetch(`http://localhost:3000/api/users/${currentUser._id}`);
        currentUser = await response.json();
        
        bookingReference.textContent = bookingRef;
        bookTicketsBtn.style.display = 'none';
        confirmationMessage.style.display = 'block';
        updateUserDashboard();
    }

    // Setup event listeners
    function setupEventListeners() {
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('book-btn')) {
                openBookingModal(e.target.dataset.movieId);
            }
            if (e.target.classList.contains('edit-movie-btn')) {
                const movie = movies.find(m => m._id === e.target.dataset.movieId);
                document.getElementById('movie-form-container').style.display = 'block';
                document.getElementById('movie-form').dataset.movieId = movie._id;
                document.getElementById('movie-title-input').value = movie.title;
                document.getElementById('movie-poster-input').value = movie.poster;
                document.getElementById('movie-duration-input').value = movie.duration;
                document.getElementById('movie-genre-input').value = movie.genre;
                document.getElementById('movie-rating-input').value = movie.rating;
                document.getElementById('movie-showtimes-input').value = movie.showtimes.join(', ');
            }
            if (e.target.classList.contains('delete-movie-btn')) {
                if (confirm('Are you sure you want to delete this movie?')) {
                    await deleteMovie(e.target.dataset.movieId);
                }
            }
            if (e.target.id === 'add-movie-btn') {
                document.getElementById('movie-form-container').style.display = 'block';
                document.getElementById('movie-form').reset();
                delete document.getElementById('movie-form').dataset.movieId;
            }
        });

        document.getElementById('movie-form')?.addEventListener('submit', handleMovieFormSubmit);

        // Close modal
        modalClose.addEventListener('click', () => {
            bookingModal.style.display = 'none';
        });

        // Book tickets button
        bookTicketsBtn.addEventListener('click', handleBookTickets);

        // Navigation links
        homeLink.addEventListener('click', () => navigateTo('home'));
        moviesLink.addEventListener('click', () => navigateTo('movies'));
        accountLink.addEventListener('click', () => navigateTo('account'));

        // Form toggles
        registerToggle.addEventListener('click', () => {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });

        loginToggle.addEventListener('click', () => {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        });

        // Login and register buttons
        loginBtn.addEventListener('click', handleLogin);
        registerBtn.addEventListener('click', handleRegister);
        logoutBtn.addEventListener('click', handleLogout);

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === bookingModal) {
                bookingModal.style.display = 'none';
            }
        });
    }

    // Setup seats
    function setupSeats() {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
        seatsGrid.innerHTML = '';
        
        for (let i = 0; i < rows.length; i++) {
            for (let j = 1; j <= 8; j++) {
                const seatId = `${rows[i]}${j}`;
                const isBooked = Math.random() < 0.3;
                
                const seat = document.createElement('div');
                seat.className = `seat ${isBooked ? 'booked' : 'available'}`;
                seat.dataset.seatId = seatId;
                seat.textContent = seatId;
                
                if (!isBooked) {
                    seat.addEventListener('click', toggleSeat);
                }
                
                seatsGrid.appendChild(seat);
            }
        }
    }

    // Toggle seat selection
    function toggleSeat(e) {
        const seat = e.target;
        seat.classList.toggle('selected');
        updateTicketSummary();
    }

    // Update ticket summary
    function updateTicketSummary() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        const count = selectedSeats.length;
        const price = count * 12;
        
        adultCount.textContent = count;
        adultTotal.textContent = price;
        totalPrice.textContent = price;
    }

    // Open booking modal
    function openBookingModal(movieId) {
        const movie = movies.find(m => m._id === movieId);
        modalMovieTitle.textContent = movie.title;
        setupSeats();
        
        const showtimeSelect = document.getElementById('showtime-select');
        showtimeSelect.innerHTML = movie.showtimes.map(time => 
            `<option value="${time}">${time}</option>`
        ).join('');
        
        updateTicketSummary();
        confirmationMessage.style.display = 'none';
        bookTicketsBtn.style.display = 'block';
        bookingModal.style.display = 'block';
    }

    // Check if user is logged in
    async function checkLoggedInUser() {
        const loggedInUserId = localStorage.getItem('currentUserId');
        if (loggedInUserId) {
            const response = await fetch(`http://localhost:3000/api/users/${loggedInUserId}`);
            if (response.ok) {
                currentUser = await response.json();
                updateUserDashboard();
                if (currentUser.role === 'admin') {
                    setupAdminPanel();
                    adminPanel.style.display = 'block';
                }
                populateMovies();
            }
        }
    }

    // Update user dashboard
    function updateUserDashboard() {
        userName.textContent = currentUser.name;
        
        bookingsList.innerHTML = '';
        if (currentUser.bookings.length === 0) {
            bookingsList.innerHTML = '<p>You have no bookings yet.</p>';
            return;
        }
        
        currentUser.bookings.forEach(booking => {
            const bookingItem = document.createElement('div');
            bookingItem.className = 'booking-item';
            bookingItem.innerHTML = `
                <h4>${booking.movie}</h4>
                <p>${booking.showtime}</p>
                <p>Seats: ${booking.seats.join(', ')}</p>
                <p>Total: $${booking.total}</p>
                <p>Booking ID: ${booking.id}</p>
            `;
            bookingsList.appendChild(bookingItem);
        });
    }

    // Show user dashboard
    function showUserDashboard() {
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        userDashboard.style.display = 'block';
    }

    // Handle logout
    function handleLogout() {
        currentUser = null;
        localStorage.removeItem('currentUserId');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        userDashboard.style.display = 'none';
        adminPanel.style.display = 'none';
    }

    // Navigate to section
    function navigateTo(section) {
        if (section === 'home' || section === 'movies') {
            moviesSection.style.display = 'block';
            accountSection.style.display = 'none';
        } else if (section === 'account') {
            moviesSection.style.display = 'none';
            accountSection.style.display = 'block';
            
            if (currentUser) {
                showUserDashboard();
            } else {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
                userDashboard.style.display = 'none';
            }
        }
    }

    // Khởi chạy
    init();
});