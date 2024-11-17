const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const multer = require('multer');
const path = require('path');


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors());
app.use(bodyParser.json());

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // The directory where images will be stored
    },
    filename: function (req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },  
}).array('images', 10);  

app.post("/uploadVehicleImages/:id", function (request, response) {
    const vehicleId = request.params.id;

    // Process the uploaded images
    upload(request, response, function (err) {
        if (err instanceof multer.MulterError) {
            return response.status(400).send({ error: "File upload error: " + err.message });
        } else if (err) {
            return response.status(500).send({ error: "Server error: " + err.message });
        }

        // Get the filenames of the uploaded images
        const uploadedImages = request.files.map(file => file.filename);
        const imagePaths = uploadedImages.join(","); // Join all filenames as a comma-separated string

        // Store the image filenames in the database for the specific vehicle
        const con = mysql.createConnection({
            host: "127.0.0.1",
            user: "root",
            password: "Port_3306",
            database: "managementVehicle"
        });

        con.connect(function (err) {
            if (err) throw err;

            // Insert image paths into the database for the vehicle (update if vehicle exists)
            const query = "UPDATE Vehicle SET image = ? WHERE id = ?";
            con.query(query, [imagePaths, vehicleId], function (err, result) {
                if (err) {
                    return response.status(500).send({ error: "Error updating vehicle images: " + err.message });
                }

                if (result.affectedRows > 0) {
                    response.status(200).send({
                        message: "Images uploaded and associated with vehicle successfully.",
                        imagePaths: uploadedImages // Return filenames to the frontend
                    });
                } else {
                    response.status(404).send({ message: "Vehicle not found with specified ID." });
                }
                con.end();
            });
        });
    });
});



const checkEmail = (req, res, next) => {
	const userEmail = req.headers['user-email'];
	if (!userEmail) {
		return res.status(403).json({ error: 'No email provided' });
	}
	req.userEmail = userEmail;
	next();
};

app.get("/", function (request, response) {
	response.send("Hello everyone.<br/><br/><br/>Use of the Express server.")
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});

// app.use(['/getAllVehicles', '/getVehicle', '/createVehicle', '/updateVehicle', '/deleteVehicle']);

app.get("/getAllVehicles", function(request, response){

	var con = mysql.createConnection({
		host: "127.0.0.1",
        user: "root",
		password: "Port_3306",
		database: "managementVehicle"
	});
	con.connect(function(err){
		if (err) throw err;
		con.query("SELECT * FROM Vehicle", function(err, result, fields){
			if (err) throw err;
			console.log(JSON.stringify(result));
			response.status(200).json(result);
            con.end();
		});
	});
});

app.get("/getVehicle/:id", function(request, response){
	const id = request.params.id;
	const con = mysql.createConnection({
		host: "127.0.0.1",
		user: "root",
		password: "Port_3306",
		database: "managementVehicle"
	});
	con.connect(function(err) {
		if (err) throw err;
		con.query("SELECT * FROM Vehicle where id = ?", [id], function (err, result, fields) {
			if (err) throw err;
			if(result.length > 0) {
				console.log(JSON.stringify(result[0]));
				response.status(200).json({
					message : "Vehicle(s) found",
					data : result[0]
				});
			}
			else{
				console.log("Vehicle(s) not found");
				response.status(200).json({
					message : "Vehicle(s) not found",
					data : {}
				});
			}
            con.end();
		});
	});
});

app.post("/createVehicle", function(request, response){
	const vehicle = request.body;
	
	console.log(vehicle.id + " " + vehicle.brand + " " + vehicle.model + " " + vehicle.year
                + " " + vehicle.color + " " + vehicle.image);
	// console.log(JSON.stringify(vehicle)); 
	
	const con = mysql.createConnection({
		host: "127.0.0.1",
		user: "root",
		password: "Port_3306",
		database: "managementVehicle"
	});

    con.connect(function(err) {
        if (err) throw err;
   
        con.query("SELECT * FROM Vehicle WHERE Id = ?", [vehicle.id], function(err, rows) {
            if (err) throw err;

            if (rows.length > 0) {
               
                response.status(400).send("Vehicle creation failed because another exsiting vehicle has a same ID.");
                con.end();
            } else {
                con.query("INSERT INTO Vehicle VALUES (?, ?, ?, ?, ?, ?)",
                [vehicle.id, vehicle.brand, vehicle.model, vehicle.year, vehicle.color, vehicle.image],  
				
				
				
				// change capital letter of variable
                function(err, result, fields) { 
                    if (err) throw err;
                    response.status(200).send("Vehicle Added");
                    con.end();
                });
            }
        }); 
	});
});

app.put("/updateVehicle/:id", function(request, response){
	const id = request.params.id;
	const vehicle = request.body;
	console.log(vehicle.id + " " + vehicle.brand + " " + vehicle.model + " " + vehicle.year
		+ " " + vehicle.color + " " + vehicle.image);
	console.log(JSON.stringify(vehicle)); 
	
	const con = mysql.createConnection({
		host: "127.0.0.1",
		user: "root",
		password: "Port_3306",
		database: "managementVehicle"
	});
	
    con.connect(function(err) {
        if (err) throw err;

        const updateQuery = "UPDATE Vehicle SET Brand = ?, Model = ?, Year = ?, Color = ?, image = ? WHERE id = ?";
        const updateValues = [vehicle.brand, vehicle.model, vehicle.year, vehicle.color, vehicle.image, id];

        con.query(updateQuery, updateValues, function (err, result, fields) {
            if (err) throw err;

            if (result.affectedRows > 0) {
                response.status(200).send("Modified Vehicle");
            } else {
                response.status(404).send("No Vehicle is found with specified id"); 
            }

            con.end();
        });
    });
});

app.delete("/deleteVehicle/:id", function(request, response){
	const id = request.params.id;
	
	const con = mysql.createConnection({
		host: "127.0.0.1",
		user: "root",
		password: "Port_3306",
		database: "managementVehicle"
	});
	
	con.connect(function(err) {
		if (err) throw err;
		con.query("DELETE FROM Vehicle where id = ?", [id], function (err, result, fields) {
			if (err) throw err;
			response.status(200).send("Vehicle deleted");
            con.end();
		});
	});
});