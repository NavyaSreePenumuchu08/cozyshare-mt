// backend/src/routes/expenseRoutes.js
const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

// ---------- CREATE EXPENSE ----------
router.post("/", async (req, res) => {
	try {
		const {
			title,
			amount,
			currency,
			paidBy,
			splitWith,
			type,
			purchaseDate,
			dueDate,
			notes,
			householdCode,
		} = req.body;

		if (!title || !amount || !paidBy || !householdCode) {
			return res.status(400).json({
				message: "Title, amount, paidBy, and householdCode are required",
			});
		}

		if (!splitWith || splitWith.length === 0) {
			return res.status(400).json({
				message: "splitWith must include at least one person",
			});
		}

		const perPerson = amount / splitWith.length;

		const expense = await Expense.create({
			title,
			amount,
			currency: currency || "EUR",
			paidBy,
			splitWith,
			perPerson,
			type: type || "one-time",
			purchaseDate: purchaseDate || null,
			dueDate: dueDate || null,
			notes: notes || "",
			householdCode,
		});

		res.status(201).json(expense);
	} catch (err) {
		console.error("Create expense error:", err);
		res.status(500).json({ message: "Server error" });
	}
});

// ---------- GET EXPENSES (all for a household) ----------
router.get("/", async (req, res) => {
	try {
		const { householdCode } = req.query;

		if (!householdCode) {
			return res.status(400).json({ message: "householdCode is required" });
		}

		const expenses = await Expense.find({
			householdCode,
		}).sort({ createdAt: -1 });

		res.json(expenses);
	} catch (err) {
		console.error("Get expenses error:", err);
		res.status(500).json({ message: "Server error" });
	}
});

// ---------- DELETE EXPENSE ----------
router.delete("/:id", async (req, res) => {
	try {
		const expense = await Expense.findById(req.params.id);

		if (!expense) {
			return res.status(404).json({ message: "Expense not found" });
		}

		await Expense.findByIdAndDelete(req.params.id);
		res.sendStatus(204);
	} catch (err) {
		console.error("Delete expense error:", err);
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;
