const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/Employee');

router.get('/', EmployeeController.getAllEmployees);
router.post('/', EmployeeController.createEmployee);
router.put('/:id', EmployeeController.updateEmployee);
// router.delete('/:id', EmployeeController.deleteEmployee);
router.put('/soft-delete/:id', EmployeeController.deleteEmployee);
router.get('/:id', EmployeeController.getEmployeeById);

module.exports = router;
