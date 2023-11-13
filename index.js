const express = require("express");
const cors = require("cors");
const flash = require('express-flash');
const session = require("express-session");

const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const passport = require("passport");
const bodyParser = require("body-parser");

const employeeRoutes = require('./routes/Employee');
const initializePassport = require("./passportConfig");
const { pool } = require("./dbConfig")

initializePassport(passport);

const PORT = process.env.PORT || 3003;

app.use(express.urlencoded({ extended: false }));

app.use(bodyParser.json()); // Parse JSON data in the request body
app.use(cors()); // Cross-Origin Resource Sharing (CORS) Allow requests coming from different platforms
app.use(express.json()); // Parse JSON data in the request body 

app.use(flash());

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000, // Session expires after 24 hours (in milliseconds)
    },
}))


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/employees', employeeRoutes);

// Signing up endpoint
app.post("/users/register", async (req, res) => {
    let { username, email, password, confirmedPassword } = req.body;

    try {
        if (!username || !email || !password || !confirmedPassword) {
            res.status(400).json({ error: "All fields are required" });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ error: "Password must have at least 8 characters" });
            return;
        }
        if (password !== confirmedPassword) {
            res.status(400).json({ error: "Passwords do not match" });
            return;
        }
        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1",
            [email]);

        if (existingUser.rows.length > 0) {
            res.status(400).json({ error: "Email already in use" });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            `INSERT INTO users (username, email, password) 
        VALUES ($1, $2, $3) RETURNING username, email`,
            [username, email, hashedPassword]);
        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Signing in endpoint
app.post('/users/login', passport.authenticate("local"), async (req, res) => {
    const { email, password } = req.body;

    // Query the database to get the user's hashed password
    const query = 'SELECT id, username, email, password FROM users WHERE email = $1';
    const values = [email];

    try {
        const result = await pool.query(query, values);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        // Verify the password (you should use a password hashing library)
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            if (isMatch) {
                // Passwords match, generate a JWT token
                const token = jwt.sign(
                    { userId: user.id },
                    process.env.SECRTETE_KEY,
                    { expiresIn: '1h' });
                res.status(200).json({ user, token, redirectUrl: "/admin" });
            } else {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Signing out endpoint
app.get("/users/logout", (req, res) => {
    req.logOut(); // This function is from passport package
    req.flash("success", "Successfully logged out !")
    res.status(200).json({ redirectUrl: "/" });
})

// Implement verifyPassword function for checking password validity
app.use((err, req, res, next) => {
    // Authentication failed
    res.status(401).json({ message: "Authentication failed" });
});

app.listen(PORT, () => {
    console.log(`Employee management server running on PORT : ${PORT}`)
})