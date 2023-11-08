const { pool } = require("../dbConfig")

const getAllEmployees = async (req, res) => {
    pool.query(
        `SELECT * FROM employees
                WHERE deleted_at IS NULL;`,
        (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json({ employees: result.rows })
        })
};

const createEmployee = async (req, res) => {
    const { name, surname, email, phone, salary, department, birthdate } = req.body;
    try {
        const { rows } = await pool.query(`INSERT INTO employees
        (name, surname, email, phone, salary, department, birthdate)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [name, surname, email, phone, salary, department, birthdate],);
        res.json({ Employee: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getEmployeeById = async (req, res) => {
    const employeeId = req.params.id;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM employees WHERE id = $1',
            [employeeId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ employee: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateEmployee = async (req, res) => {
    let { name, surname, email, phone, salary, department, birthdate } = req.body;
    const employeeId = req.params.id;

    pool.query(
        `UPDATE employees
        set name = $1, surname = $2, email = $3, phone = $4, salary = $5, department = $6, birthdate = $7
        WHERE id = $8
        RETURNING *`,
        [name, surname, email, phone, salary, department, birthdate, employeeId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Employee not found" });
            }

            const updatedEmployee = result?.rows[0];
            res.json({ data: updatedEmployee });
        }
    );
};

const deleteEmployee = async (req, res) => {
    const employeeId = req.params.id;
    const deletedAt = new Date(); // Set the current timestamp as the deletion time

    try {
        const { rows } = await pool.query(
            `UPDATE employees
        SET deleted_at = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING * `,
            [deletedAt, employeeId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const deletedEmployee = rows[0];
        res.json({ data: deletedEmployee });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getAllEmployees,
    createEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
};
