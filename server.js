const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(cors());

// Kết nối MongoDB
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI, {  
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Schema cho Movie
const movieSchema = new mongoose.Schema({
    title: String,
    poster: String,
    duration: String,
    genre: String,
    rating: String,
    showtimes: [String]
});
const Movie = mongoose.model('Movie', movieSchema);

// Schema cho User
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: { type: String, default: 'user' },
    bookings: [{
        movie: String,
        showtime: String,
        seats: [String],
        total: Number,
        id: String
    }]
});
const User = mongoose.model('User', userSchema);

// ====================== API ROUTES ========================

// Lấy danh sách phim
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find();
        res.json(movies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching movies' });
    }
});

// Thêm phim mới
app.post('/api/movies', async (req, res) => {
    try {
        const movie = new Movie(req.body);
        await movie.save();
        res.status(201).json(movie);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding movie' });
    }
});

// Sửa phim
app.put('/api/movies/:id', async (req, res) => {
    try {
        const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        res.json(movie);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating movie' });
    }
});

// Xóa phim
app.delete('/api/movies/:id', async (req, res) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        res.json({ message: 'Movie deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting movie' });
    }
});

// Đăng ký người dùng
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Đăng nhập
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Lấy thông tin người dùng
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching user' });
    }
});

// Cập nhật đặt vé
app.put('/api/users/:id/bookings', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.bookings.push(req.body.booking);
        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding booking' });
    }
});

// Khởi động server
app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
