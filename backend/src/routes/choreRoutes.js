// backend/src/routes/choreRoutes.js
const express = require("express");
const router = express.Router();
const Chore = require("../models/Chore");

// helper: start/end of week
// parse "YYYY-MM-DD" as a local date (no timezone shift)
function parseYMD(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d); // local date
}

function getWeekRange(date) {
  const d = new Date(date);
  // make Monday the first day (Europe style)
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);

  const end = new Date(start);
  end.setDate(start.getDate() + 7); // [start, end)
  return { start, end };
}

// ---------- CREATE CHORE ----------
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      householdCode,
      createdBy,
      assignedTo,
      dueDate,
      frequency,

      location,
      category,
      priority,
      priorityReason,
      source,
      assignmentReason,
    } = req.body;

    if (!title || !householdCode || !createdBy || !dueDate) {
      return res.status(400).json({
        message: "Title, householdCode, createdBy and dueDate are required",
      });
    }

    let due;
    if (typeof dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      // from <input type="date">: treat as LOCAL date
      due = parseYMD(dueDate);
    } else {
      due = new Date(dueDate);
    }

    const chore = await Chore.create({
      title,
      description: description || "",
      householdCode,
      createdBy,
      assignedTo: assignedTo || "",
      dueDate: due,
      frequency: frequency || "once",

      location: location || "General",
      category: category || "General",
      priority: priority || "Medium",
      priorityReason: priorityReason || "",
      source: source || "Manual",
      assignmentReason: assignmentReason || "",
    });

    res.status(201).json(chore);
  } catch (err) {
    console.error("Create chore error:", err);

    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// ---------- GET CHORES (all for a household) ----------
router.get("/", async (req, res) => {
  try {
    const { householdCode } = req.query;

    if (!householdCode) {
      return res.status(400).json({ message: "householdCode is required" });
    }

    const chores = await Chore.find({
      householdCode,
    }).sort({ dueDate: 1, createdAt: -1 });

    res.json(chores);
  } catch (err) {
    console.error("Get chores error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- TOGGLE COMPLETE ----------
router.patch("/:id/complete", async (req, res) => {
  try {
    const { currentUser } = req.body;
    if (!currentUser) {
      return res.status(400).json({ message: "currentUser is required" });
    }

    const chore = await Chore.findById(req.params.id);
    if (!chore) {
      return res.status(404).json({ message: "Chore not found" });
    }

    const userLower = currentUser.toLowerCase();
    const isAssignee =
      chore.assignedTo && chore.assignedTo.toLowerCase() === userLower;
    const isCreator = chore.createdBy.toLowerCase() === userLower;
    const isShared = !chore.assignedTo || chore.assignedTo.trim() === "";

    // Allow creator, assignee, or anyone for shared chores
    if (!isCreator && !isAssignee && !isShared) {
      return res.status(403).json({
        message:
          "Only the assignee, creator, or anyone for shared chores can mark this as done",
      });
    }

    const now = new Date();
    let newChore = null;
    let removedChoreId = null;

    // Check if this is a recurring chore
    const isRecurring = chore.frequency && chore.frequency !== "once";

    if (!isRecurring) {
      // ONE-TIME CHORE: Simple toggle
      chore.completed = !chore.completed;
      chore.completedAt = chore.completed ? now : null;
      chore.completedBy = chore.completed ? currentUser : null;
    } else {
      // RECURRING CHORE
      if (!chore.completed) {
        // MARKING AS COMPLETE: Create next instance
        chore.completed = true;
        chore.completedAt = now;
        chore.completedBy = currentUser;

        // Calculate next due date
        const nextDue = new Date(chore.dueDate || now);
        if (chore.frequency === "daily") {
          nextDue.setDate(nextDue.getDate() + 1);
        } else if (chore.frequency === "weekly") {
          nextDue.setDate(nextDue.getDate() + 7);
        } else if (chore.frequency === "monthly") {
          nextDue.setMonth(nextDue.getMonth() + 1);
        }

        // Create new instance for next occurrence
        newChore = await Chore.create({
          title: chore.title,
          description: chore.description,
          householdCode: chore.householdCode,
          createdBy: chore.createdBy,
          assignedTo: chore.assignedTo,
          dueDate: nextDue,
          frequency: chore.frequency,
          parentChoreId: chore._id, // Track which chore this came from
        });
      } else {
        // MARKING AS INCOMPLETE (UNDO): Remove next instance if it exists
        chore.completed = false;
        chore.completedAt = null;
        chore.completedBy = null;

        // Find and delete the next instance that was created
        const nextInstance = await Chore.findOne({
          parentChoreId: chore._id,
          completed: false,
          householdCode: chore.householdCode,
        }).sort({ dueDate: 1 });

        if (nextInstance) {
          removedChoreId = nextInstance._id;
          await Chore.findByIdAndDelete(nextInstance._id);
        }
      }
    }

    await chore.save();

    // Return response with all relevant data
    const response = {
      chore: chore,
    };

    if (newChore) {
      response.newChore = newChore;
    }

    if (removedChoreId) {
      response.removedChoreId = removedChoreId;
    }

    res.json(response);
  } catch (err) {
    console.error("Complete chore error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- DELETE CHORE ----------
router.delete("/:id", async (req, res) => {
  try {
    const chore = await Chore.findById(req.params.id);

    if (!chore) {
      return res.status(404).json({ message: "Chore not found" });
    }

    await Chore.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    console.error("Delete chore error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
