const bcrypt = require("bcrypt"); // On utilise l'algorithme bcrypt pour hasher le mot de passe des utilisateurs
const jwt = require("jsonwebtoken"); // On utilise le package jsonwebtoken pour attribuer un token à un utilisateur au moment où il se connecte
// const maskData = require("maskdata"); // On utilise le package maskdata pour cacher les donnés sensibles, ici l'adresse mail

// Réglage du module maskdata
// const emailMaskOpt = {
// 	maskWith: "*",
// 	unmaskedStartCharactersBeforeAt: 1,
// 	unmaskedEndCharactersAfterAt: 3,
// 	maskAtTheRate: false,
// };

const User = require("../models/User");

// Middleware pour crée un nouvel utilisateur
exports.signup = (req, res, next) => {
	bcrypt
		// On appelle la méthode hash de bcrypt et on lui passe le mdp de l'utilisateur, le salte (10) ce sera le nombre de tours qu'on fait faire à l'algorithme
		.hash(req.body.password, 10)
		.then((hash) => {
			// On récupère le hash de mdp qu'on va enregister en tant que nouvel utilisateur dans la BBD mongoDB
			const user = new User({
				email: req.body.email,
				password: hash,
			});
			// On enregistre l'utilisateur dans la base de données
			user
				.save()
				.then(() => res.status(201).json({ message: "Utilisateur créé !" }))
				.catch((error) => res.status(400).json({ error }));
		})
		.catch((error) => res.status(500).json({ error }));
};

// Le Middleware pour la connexion d'un utilisateur vérifie si l'utilisateur existe dans la base MongoDB lors du login
exports.login = (req, res, next) => {
	User.findOne({ email: req.body.email })
		.then((user) => {
			if (!user) {
				return res.status(401).json({ error: "Utilisateur non trouvé !" });
			}
			bcrypt
				.compare(req.body.password, user.password)
				.then((valid) => {
					if (!valid) {
						return res.status(401).json({ error: "Mot de passe incorrect !" });
					}
					// Si true, on renvoie un statut 200 et un objet JSON avec un userID + un token
					res.status(200).json({
						userId: user._id,
						token: jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
							expiresIn: "24h",
						}),
					});
				})
				.catch((error) => res.status(500).json({ error }));
		})
		.catch((error) => res.status(500).json({ error }));
};
