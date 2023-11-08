const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
    const autenticateUser = (email, password, done) => {

        pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email],
            (err, result) => {
                if (err) {
                    throw err
                }
                if (result.rows.length > 0) {
                    const user = result.rows[0];

                    // comparing the input password with the password found on the database
                    bcrypt.compare(password, user.password,
                        (err, isMatch) => {
                            if (err) {
                                throw err
                            }
                            if (isMatch) {
                                // error parameter is null if there is a result
                                return done(null, user);
                            }
                            else {
                                return done(null, false, { message: "Password is not correct" });
                            }
                        })
                } else {
                    return done(null, false, { message: "Email is not registered" })
                }
            })
    }

    passport.use(
        new LocalStrategy({
            usernameField: "email",
            passwordField: "password"
        },
            autenticateUser
        )
    )

    // Storing the user's id oin the session
    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser((id, done) => {
        pool.query(
            `SELECT * FROM users WHERE id = $1`,
            [id],
            (err, result) => {
                if (err) {
                    throw err
                }
                return done(null, result.rows[0])
            }
        )
    })
}


module.exports = initialize;
