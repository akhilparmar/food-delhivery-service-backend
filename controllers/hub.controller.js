import Hub from "../models/hub.model.js";

/**
 * Find nearest hub based on coordinates
 */
export const findNearestHub = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // Find nearest hub using geospatial query
    const nearestHub = await Hub.findOne({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat], // MongoDB uses [longitude, latitude]
          },
          $maxDistance: 50000, // 50km max distance in meters
        },
      },
    }).populate("manager_id", "name email");

    if (!nearestHub) {
      return res.status(404).json({ message: "No hub found within range" });
    }

    res.json(nearestHub);
  } catch (error) {
    console.error("Error finding nearest hub:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get all hubs
 */
export const getAllHubs = async (req, res) => {
  try {
    const hubs = await Hub.find().populate("manager_id", "name email");
    res.json(hubs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update hub details (assign manager)
 */
export const updateHub = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const hub = await Hub.findByIdAndUpdate(id, updates, { new: true }).populate("manager_id", "name email");

    if (!hub) {
      return res.status(404).json({ message: "Hub not found" });
    }

    res.json(hub);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Create new hub (Admin only)
 */
export const createHub = async (req, res) => {
  try {
    const { name, address, contact_number } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    if (!name || !address || !contact_number) {
      return res.status(400).json({ message: "Name, address, and contact number are required" });
    }

    const newHub = new Hub({
      name,
      address: {
        ...address,
        location: { type: "Point", coordinates: [0, 0] } // Default coordinates
      },
      contact_number,
    });

    await newHub.save();
    res.status(201).json(newHub);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



