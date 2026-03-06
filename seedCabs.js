const mongoose = require("mongoose");
const Cab = require("./models/Cab");

mongoose.connect("mongodb://127.0.0.1:27017/cab_booking")
  .then(async () => {
    await Cab.deleteMany();

    await Cab.insertMany([
      {
        cabType: "Mini",
        vehicleName: "Swift",
        pricePerKm: 10,
        capacity: 4,
      },
      {
        cabType: "Sedan",
        vehicleName: "Dzire",
        pricePerKm: 12,
        capacity: 4,
      },
      {
        cabType: "SUV",
        vehicleName: "Innova",
        pricePerKm: 18,
        capacity: 6,
      }
    ]);

    console.log("✅ Cabs seeded");
    process.exit();
  })
  .catch(console.error);
