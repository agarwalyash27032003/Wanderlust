const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    listing : Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().allow("", null),
        amenities: Joi.array().items(Joi.string()).optional(), 
        property_type: Joi.string().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),  
        maxGuests: Joi.number().required(),  
        numOfRooms: Joi.number().required(),   
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required(),
        comment: Joi.string().required(),
    }).required()
});