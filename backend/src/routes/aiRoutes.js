const express = require("express");
const router = express.Router();
const Chore = require("../models/Chore");
const User = require("../models/User");

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/suggest-task", async (req, res) => {
  try {
    const { description, location } = req.body;

    if (!description || description.trim() === "") {
      return res.status(400).json({ message: "Description is required" });
    }

    let taskTitle = "General household task";
    let priority = "Medium";
    let suggestedLocation = location || "General";
    let taskCategory = "General";

    const text = description.toLowerCase();

    if (
      text.includes("dish") ||
      text.includes("dishes") ||
      text.includes("sink") ||
      text.includes("plate") ||
      text.includes("plates") ||
      text.includes("cup") ||
      text.includes("cups") ||
      text.includes("glass") ||
      text.includes("pan") ||
      text.includes("pot")
    ) {
      taskTitle = "Wash the dishes";
      suggestedLocation = "Kitchen";
      priority = "High";
      taskCategory = "Kitchen";
      reason =
        "Dirty dishes can affect kitchen hygiene and should be completed quickly.";
    } else if (
      text.includes("trash") ||
      text.includes("garbage") ||
      text.includes("bin") ||
      text.includes("waste") ||
      text.includes("rubbish")
    ) {
      taskTitle = "Take out the trash";
      suggestedLocation = "Kitchen";
      priority = "High";
      taskCategory = "Kitchen";
      reason = "Overflowing trash can cause bad smell and hygiene issues.";
    } else if (
      text.includes("counter") ||
      text.includes("stove") ||
      text.includes("oven") ||
      text.includes("microwave") ||
      text.includes("fridge") ||
      text.includes("kitchen dirty") ||
      text.includes("food spill")
    ) {
      taskTitle = "Clean the kitchen area";
      suggestedLocation = "Kitchen";
      priority = "Medium";
      taskCategory = "Kitchen";
      reason =
        "Cleaning kitchen surfaces helps maintain hygiene and prevents food-related mess.";
    } else if (
      text.includes("clothes") ||
      text.includes("laundry") ||
      text.includes("washing machine") ||
      text.includes("dryer") ||
      text.includes("dirty clothes") ||
      text.includes("clothes pile") ||
      text.includes("basket")
    ) {
      taskTitle = "Do the laundry";
      suggestedLocation = "Laundry area";
      priority = "Medium";
      taskCategory = "Laundry";
      reason =
        "Laundry is important for cleanliness but is usually not urgent unless clothes are piled up.";
    } else if (
      text.includes("fold") ||
      text.includes("folding") ||
      text.includes("wardrobe") ||
      text.includes("closet") ||
      text.includes("ironing") ||
      text.includes("iron")
    ) {
      taskTitle = "Organize clean clothes";
      suggestedLocation = "Bedroom";
      priority = "Low";
      taskCategory = "Bedroom";
      reason =
        "Organizing clothes improves room cleanliness but is usually less urgent.";
    } else if (
      text.includes("floor") ||
      text.includes("dust") ||
      text.includes("dusty") ||
      text.includes("vacuum") ||
      text.includes("mop") ||
      text.includes("sweep") ||
      text.includes("crumbs")
    ) {
      taskTitle = "Clean the floor";
      suggestedLocation = "Living room";
      priority = "Medium";
      taskCategory = "Living Room";
      reason =
        "Cleaning the floor improves comfort, hygiene, and shared living cleanliness.";
    } else if (
      text.includes("bathroom") ||
      text.includes("toilet") ||
      text.includes("shower") ||
      text.includes("washbasin") ||
      text.includes("mirror") ||
      text.includes("bathroom sink")
    ) {
      taskTitle = "Clean the bathroom";
      suggestedLocation = "Bathroom";
      priority = "High";
      taskCategory = "Bathroom";
      reason =
        "Bathroom cleaning is important for hygiene and should not be delayed.";
    } else if (
      text.includes("bed") ||
      text.includes("bedsheet") ||
      text.includes("blanket") ||
      text.includes("pillow") ||
      text.includes("bedroom messy") ||
      text.includes("room messy")
    ) {
      taskTitle = "Tidy the bedroom";
      suggestedLocation = "Bedroom";
      priority = "Low";
      taskCategory = "Bedroom";
      suggestedLocation = "Bedroom";
      priority = "Low";
      reason = "Tidying the bedroom improves personal space and comfort.";
    } else if (
      text.includes("sofa") ||
      text.includes("table") ||
      text.includes("living room") ||
      text.includes("messy living") ||
      text.includes("cushion") ||
      text.includes("remote")
    ) {
      taskTitle = "Tidy the living room";
      suggestedLocation = "Living room";
      priority = "Medium";
      taskCategory = "Living Room";
      reason =
        "The living room is a shared space, so keeping it tidy improves household comfort.";
    } else if (
      text.includes("garden") ||
      text.includes("gardening") ||
      text.includes("plants") ||
      text.includes("plant") ||
      text.includes("water plants") ||
      text.includes("lawn") ||
      text.includes("balcony") ||
      text.includes("leaves")
    ) {
      taskTitle = "Take care of plants or garden";
      suggestedLocation = "Garden/Balcony";
      priority = "Medium";
      taskCategory = "Garden";
      reason =
        "Plants and garden areas need regular care to stay healthy and clean.";
    } else if (
      text.includes("grocery") ||
      text.includes("groceries") ||
      text.includes("milk") ||
      text.includes("egg") ||
      text.includes("eggs") ||
      text.includes("bread") ||
      text.includes("vegetables") ||
      text.includes("fruit") ||
      text.includes("rice") ||
      text.includes("oil")
    ) {
      taskTitle = "Update grocery list";
      suggestedLocation = "Kitchen";
      priority = "Low";
      taskCategory = "Grocery";
      reason =
        "Grocery updates help household planning but are usually not immediately urgent.";
    } else if (
      text.includes("shopping") ||
      text.includes("buy") ||
      text.includes("out of stock") ||
      text.includes("finished") ||
      text.includes("empty bottle") ||
      text.includes("no milk") ||
      text.includes("no bread")
    ) {
      taskTitle = "Buy missing household items";
      suggestedLocation = "General";
      priority = "Medium";
      taskCategory = "Grocery";
      reason =
        "Missing essential items should be handled soon to avoid household inconvenience.";
    } else if (
      text.includes("bill") ||
      text.includes("electricity") ||
      text.includes("water bill") ||
      text.includes("internet bill") ||
      text.includes("rent") ||
      text.includes("payment") ||
      text.includes("due")
    ) {
      taskTitle = "Check and pay household bill";
      suggestedLocation = "General";
      priority = "High";
      taskCategory = "General";
      reason =
        "Bills with due dates are important and delays can cause penalties or service issues.";
    } else if (
      text.includes("maintenance") ||
      text.includes("broken") ||
      text.includes("repair") ||
      text.includes("leak") ||
      text.includes("light not working") ||
      text.includes("bulb") ||
      text.includes("heater") ||
      text.includes("wifi not working")
    ) {
      taskTitle = "Report or fix maintenance issue";
      suggestedLocation = "General";
      priority = "High";
      taskCategory = "General";
      reason =
        "Maintenance issues can affect safety, comfort, or daily household use.";
    } else if (
      text.includes("window") ||
      text.includes("windows") ||
      text.includes("curtain") ||
      text.includes("curtains") ||
      text.includes("ventilation")
    ) {
      taskTitle = "Clean or organize window area";
      suggestedLocation = "Living room";
      priority = "Low";
      taskCategory = "Living Room";
      reason =
        "Window and curtain cleaning improves freshness but is usually not urgent.";
    } else if (
      text.includes("fridge smell") ||
      text.includes("expired") ||
      text.includes("old food") ||
      text.includes("spoiled") ||
      text.includes("leftover")
    ) {
      taskTitle = "Clean the fridge";
      suggestedLocation = "Kitchen";
      priority = "High";
      taskCategory = "Kitchen";
      reason = "Expired or spoiled food can cause smell and hygiene problems.";
    } else if (
      text.includes("pet") ||
      text.includes("cat") ||
      text.includes("dog") ||
      text.includes("litter") ||
      text.includes("pet food")
    ) {
      taskTitle = "Take care of pet-related task";
      suggestedLocation = "General";
      priority = "High";
      taskCategory = "General";
      reason =
        "Pet care tasks are time-sensitive and important for animal hygiene and wellbeing.";
    } else if (
      text.includes("guest") ||
      text.includes("visitors") ||
      text.includes("friends coming") ||
      text.includes("party") ||
      text.includes("dinner plan")
    ) {
      taskTitle = "Prepare shared space for guests";
      suggestedLocation = "Living room";
      priority = "Medium";
      taskCategory = "Living Room";
      reason =
        "Preparing shared spaces before guests arrive improves comfort and presentation.";
    } else {
      taskTitle = "General household task";
      suggestedLocation = "General";
      priority = "Medium";
      taskCategory = "General";
      reason =
        "This task helps keep the shared household organized and manageable.";
    }
    res.json({
      suggestedTask: {
        title: taskTitle,
        description,
        location: suggestedLocation,
        priority,
        priorityReason: reason,
        category: taskCategory,
        status: "Pending",
        source: "AI Suggestion",
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "AI suggestion failed", error: error.message });
  }
});

router.post("/create-chore", async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      priority,
      assignedTo,
      householdCode,
      dueDate,
    } = req.body;

    if (!title || !householdCode) {
      return res.status(400).json({
        message: "Title and householdCode are required",
      });
    }

    const chore = new Chore({
      title,
      description,
      location,
      priority: priority || "Medium",
      assignedTo: assignedTo || "",
      householdCode,
      dueDate: dueDate || new Date(),
      status: "Pending",
      category: taskCategory,
      source: "AI Suggestion",
    });

    await chore.save();

    res.status(201).json({
      message: "AI suggested chore created successfully",
      chore,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create AI chore",
      error: error.message,
    });
  }
});

router.post("/suggest-assignee", async (req, res) => {
  try {
    const { householdCode, members, taskPriority, taskCategory } = req.body;

    if (!householdCode) {
      return res.status(400).json({
        message: "householdCode is required",
      });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        message: "Household members are required",
      });
    }

    const householdUsers = await User.find({
      householdCode,
    }).select("name email taskPreferences");

    const preferenceMap = {};

    householdUsers.forEach((user) => {
      const memberName = user.name || user.email;

      preferenceMap[memberName.toLowerCase()] = user.taskPreferences || [];
    });

    const startOfWeek = new Date();
    const currentDay = startOfWeek.getDay();
    const mondayDifference = currentDay === 0 ? -6 : 1 - currentDay;

    startOfWeek.setDate(startOfWeek.getDate() + mondayDifference);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const chores = await Chore.find({
      householdCode,
      dueDate: {
        $gte: startOfWeek,
        $lt: endOfWeek,
      },
    });

    const priorityWeights = {
      High: 3,
      Medium: 2,
      Low: 1,
    };

    const workload = {};

    members.forEach((member) => {
      const preferences = preferenceMap[member.toLowerCase()] || [];

      const preferenceMatched = preferences.some(
        (preference) =>
          preference.toLowerCase() ===
          (taskCategory || "General").toLowerCase(),
      );

      workload[member] = {
        totalChores: 0,
        pendingChores: 0,
        completedChores: 0,
        workloadScore: 0,
        lastAssignedAt: null,

        taskPreferences: preferences,
        preferenceMatched,
        preferenceBonus: preferenceMatched ? 2 : 0,
        effectiveScore: 0,
      };
    });

    chores.forEach((chore) => {
      const assignee = chore.assignedTo;

      if (!assignee || !workload[assignee]) {
        return;
      }

      workload[assignee].totalChores += 1;

      const assignmentDate =
        chore.createdAt || chore.updatedAt || chore.dueDate;

      if (assignmentDate) {
        const currentLastAssignment = workload[assignee].lastAssignedAt
          ? new Date(workload[assignee].lastAssignedAt)
          : null;

        const newAssignmentDate = new Date(assignmentDate);

        if (
          !currentLastAssignment ||
          newAssignmentDate > currentLastAssignment
        ) {
          workload[assignee].lastAssignedAt = newAssignmentDate;
        }
      }

      if (chore.completed) {
        workload[assignee].completedChores += 1;
      } else {
        workload[assignee].pendingChores += 1;

        const weight = priorityWeights[chore.priority] || 2;
        workload[assignee].workloadScore += weight;
      }
    });

    members.forEach((member) => {
      workload[member].effectiveScore =
        workload[member].workloadScore - workload[member].preferenceBonus;
    });
    const sortedMembers = [...members].sort((memberA, memberB) => {
      const workloadA = workload[memberA];
      const workloadB = workload[memberB];

      const effectiveScoreDifference =
        workloadA.effectiveScore - workloadB.effectiveScore;

      if (effectiveScoreDifference !== 0) {
        return effectiveScoreDifference;
      }

      const scoreDifference = workloadA.workloadScore - workloadB.workloadScore;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const pendingDifference =
        workloadA.pendingChores - workloadB.pendingChores;

      if (pendingDifference !== 0) {
        return pendingDifference;
      }

      const totalDifference = workloadA.totalChores - workloadB.totalChores;

      if (totalDifference !== 0) {
        return totalDifference;
      }

      const lastAssignedA = workloadA.lastAssignedAt
        ? new Date(workloadA.lastAssignedAt).getTime()
        : 0;

      const lastAssignedB = workloadB.lastAssignedAt
        ? new Date(workloadB.lastAssignedAt).getTime()
        : 0;

      return lastAssignedA - lastAssignedB;
    });

    const suggestedAssignee = sortedMembers[0];
    const selectedWorkload = workload[suggestedAssignee];
    const preferenceText = selectedWorkload.preferenceMatched
      ? `${suggestedAssignee} prefers ${taskCategory} tasks.`
      : `${suggestedAssignee} has no recorded preference for ${taskCategory} tasks.`;
    const incomingTaskWeight = priorityWeights[taskPriority] || 2;

    const lastAssignedText = selectedWorkload.lastAssignedAt
      ? new Date(selectedWorkload.lastAssignedAt).toLocaleDateString()
      : "never";

    const assignmentReason =
      `${suggestedAssignee} was selected for this ` +
      `${taskCategory || "General"} task. ` +
      `${preferenceText} ` +
      `Their workload score is ${selectedWorkload.workloadScore}, ` +
      `their preference-adjusted score is ${selectedWorkload.effectiveScore}, ` +
      `and they have ${selectedWorkload.pendingChores} pending chore(s).`;

    res.json({
      suggestedAssignee,
      assignmentReason,
      workload,
      taskPriority: taskPriority || "Medium",
      taskCategory: taskCategory || "General",
      incomingTaskWeight,
      preferenceMatched: selectedWorkload.preferenceMatched,
    });
  } catch (error) {
    console.error("Smart assignment error:", error);

    res.status(500).json({
      message: "Smart assignment failed",
      error: error.message,
    });
  }
});

router.post("/weather-suggestion", async (req, res) => {
  try {
    const {
      location,
      temperature,
      feelsLike,
      humidity,
      precipitation,
      rain,
      rainProbability,
      rainExpectedSoon,
      windSpeed,
      condition,
    } = req.body;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",

      input: `
You are the weather-aware household assistant inside CozyShare.

Current weather:
Location: ${location}
Condition: ${condition}
Temperature: ${temperature}°C
Feels like: ${feelsLike}°C
Humidity: ${humidity}%
Current precipitation: ${precipitation} mm
Current rain: ${rain} mm
Chance of rain in the next few hours: ${rainProbability}%
Rain expected soon: ${rainExpectedSoon ? "Yes" : "No"}
Wind speed: ${windSpeed} km/h

Give a very short practical suggestion for people sharing a household.

Requirements:
- Maximum 3 short sentences.
- Mention useful personal advice when appropriate, such as taking an umbrella.
- Recommend suitable household chores based on the weather.
- Mention outdoor chores such as gardening only when relevant.
- Do not exaggerate risks.
- Do not use headings.
- Keep the tone friendly and practical.
      `.trim(),
    });

    const suggestion =
      response.output_text?.trim() ||
      "Plan household activities according to the current weather.";

    res.json({
      suggestion,
    });
  } catch (error) {
    console.error("Weather AI suggestion error:", error.message);

    res.status(500).json({
      message: "Could not generate weather suggestion.",
    });
  }
});

module.exports = router;
