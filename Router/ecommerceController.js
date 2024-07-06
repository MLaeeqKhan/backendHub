const express = require("express");
const router = express.Router();
const cloudinary = require("../Middleware/cloudinay");
const Product = require("../Models/EcommerceModels/ProductSchema");
const ProductReview = require("../Models/EcommerceModels/ProductReviewsSchema");
const AddToCart = require("../Models/EcommerceModels/AddToCartSchema");
const Order = require("../Models/EcommerceModels/OrderFormSchema");
const Services = require("../Models/EcommerceModels/ServicesSchema");
const VendorProfile = require("../Models/EcommerceModels/VenderProfileSchema");
const User = require("../Models/ChatModels/userModel");
const multer = require("multer");
const stripe = require("stripe")(process.env.STRIPE_SECRRT);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Route to post a new product
router.post("/postProduct",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "multipleImages", maxCount: 12 },
  ]),
  async (req, res) => {
    const {
      productName,
      productCode,
      userId,
      productDescription,
      stockQuantity,
      productPrice,
      category,
      startDate,
      endDate,
    } = req.body;

    const image = req.files["image"] ? req.files["image"][0] : null;
    const multipleImages = req.files["multipleImages"] || [];

    console.log("Products Name:", productName);
  console.log("Products productCode:", productCode);
    console.log("Products userId:", userId);
    console.log("Products productImg:", image);
    console.log("Products multipleImages:", multipleImages);
    console.log("Products productDescription:", productDescription);
    console.log("Products productPrice:", productPrice);
    console.log("Products stockQuantity:", stockQuantity);
    console.log("Products category:", category);
    console.log("Products startDate:", startDate);
    console.log("Products endDate:", endDate);

    try {
      if (
        !image ||
        !productName ||
        !productCode ||
        !productDescription ||
        !productPrice ||
        !stockQuantity ||
        !category
      ) {
        return res.status(422).send("Please Fill All Fields!");
      }

      const result = await cloudinary.uploader.upload(image.path, {
        folder: "products",
      });

      const multipleImagesResults = await Promise.all(
        multipleImages.map(async (file) => {
          const res = await cloudinary.uploader.upload(file.path, {
            folder: "products",
          });
          return {
            public_id: res.public_id,
            url: res.secure_url,
          };
        })
      );

      const product = await Product.create({
        image: {
          public_id: result.public_id,
          url: result.secure_url,
        },
        multipleImages: multipleImagesResults,
        userId,
        productName,
        productCode,
        productDescription,
        productPrice,
        stockQuantity,
        category,
        startDate,
        endDate,
      });

      res.status(200).send("Product Posted Successfully");
    } catch (error) {
      console.error("error", error);
      res.status(500).send("postProduct Internal Server error!");
    }
  }
);


router.get("/getProducts", async (req, res) => {
  try {
    const products = await Product.find().populate({
      path: 'userId',
      select: 'userName'
    });
    console.log("products", products)
    res.json({ products });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});

router.get("/getProductByuserId/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const products = await Product.find({userId}).populate({
      path: 'userId',
      select: 'userName'
    });
    console.log("products", products)
    res.json({ products });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});

// Delete products by product ID
router.delete("/deleteProducts/:deleteId", async (req, res) => {
  const { deleteId } = req.params;
  console.log("productId:", deleteId);
  try {
    await Product.deleteOne({ _id: deleteId });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "deleteProducts Internal server error" });
  }
});

router.post("/addToCart", async (req, res) => {
  const { productId, userId, quantity } = req.body;

  if (!productId || !userId || !quantity) {
    return res.status(400).send("Product ID and quantity are required.");
  }

  try {
    const cart = new AddToCart({ productId, userId, quantity });
    await cart.save();
    res.status(200).send("Product Successfully Added To Cart!");
  } catch (error) {
    console.error("addToCart error:", error);
    res.status(500).send("Internal Server Error while adding product to cart.");
  }
});

router.get("/getCartData/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const cartProduct = await AddToCart.find({ userId }).populate("productId");
    if (!cartProduct || cartProduct.length === 0) {
      return res.status(404).send("Empty Cart!");
    }
    res.json({ cartProduct });
  } catch (error) {
    console.error("getCartData error:", error);
    res
      .status(500)
      .send("getCartData: Internal Server Error while fetching cart data.");
  }
});

// Delete cart Product by cart Product ID
router.delete("/deleteCartProducts/:cartProductId",
  async (req, res) => {
    const { cartProductId } = req.params;
    console.log("productId:", cartProductId);
    try {
      await AddToCart.deleteOne({ _id: cartProductId });
      res.sendStatus(204);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "deleteCartProducts Internal server error" });
    }
  }
);

// Delete cart Product by cartProduct's userId after successfull payment
router.delete("/deleteCartProductsAfterPayment/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("productId:", userId);
  try {
    await AddToCart.deleteMany({ userId: userId });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "deleteCartProductsAfterPayment Internal server error" });
  }
});

router.post('/productsReview', async (req, res) => {
  const { productId, userId, content } = req.body;

  if (!productId || !userId || !content) {
    return res.status(400).send("Product ID, user ID, and content are required.");
  }

  try {
    const review = new ProductReview({ productId, userId, content });
    await review.save();
    res.status(200).send("Review Posted Successfully!");
  } catch (error) {
    console.error("productsReview error:", error);
    res.status(500).send("Internal Server Error while Review Posting!");
  }
});

router.get("/getReviews/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
    const reviews = await ProductReview.find({ productId }).populate({
      path: 'userId',
      select: 'userName'
    });
    if (!reviews || reviews.length === 0) {
      return res.status(200).send("Product yet not have any review!");
    }
    res.json({ reviews });
  } catch (error) {
    console.error("getReviews error:", error);
    res
      .status(500)
      .send("getReview: Internal Server Error while fetching Reviews.");
  }
});

// Create a new order
router.post("/createOrder", async (req, res) => {
  console.log("req.body:", req.body);
  
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    console.log('Order saved:', savedOrder);
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(400).json({ message: error.message });
  }
});


router.get("/getOrders", async (req, res) => {
  try {
    const orders = await Order.find().populate('productIdies.productId');
    console.log("orders:", orders);
    res.json({ orders });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});


router.delete("/deleteOrder/:id", async (req, res) => {
  const { id } = req.params;
  console.log("id:", id);
  try {
    await Order.deleteOne({ _id: id });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "deleteOrder Internal server error" });
  }
}
);
router.put('/updateOrder-status/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'order not found' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: 'order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { products } = req.body;
    const cart = products;
    console.log("create-checkout-session cart:", cart);

    let userId = '';
    const lineItems = cart.map(cartItem => {
      const product = cartItem.productId;
      console.log('create-checkout-session product.productPrice:', product.productName);
      const price = product.productPrice;
      const unitAmount = Math.round(price * 100);

      userId = product.userId;
      if (isNaN(unitAmount)) {
        throw new Error(`Invalid product price for product ID: ${product._id}`);
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.productName,
            images: [product.image.url],
          },
          unit_amount: unitAmount,
        },
        quantity: cartItem.quantity,
      };
    });

    // Add the shipment charge
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Shipping Charge",
        },
        unit_amount: 75, // $0.75 in cents
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://localhost:3000/paymentSuccess",
      cancel_url: "http://localhost:3000/paymentCancel",
    });
    console.log("session:", session);
    res.json({ id: session.id });
  } catch (error) {
    console.error("Stripe checkout session error:", error);
    res.status(500).send({ error: error.message });
  }
});


router.post('/update-solds', async (req, res) => {
  try {
    const { updateproducts } = req.body;
console.log('update-solds products:', updateproducts)
    for (const product of updateproducts) {
      const { productId, quantity } = product;
      const id=productId._id
      await Product.findByIdAndUpdate(id, {
        $inc: { solds: quantity }
      });
    }

    res.status(200).json({ message: 'Solds updated successfully' });
  } catch (error) {
    console.error('Error updating solds:', error);
    res.status(500).send({ error: error.message });
  }
});

router.post("/create-service",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "multipleImages", maxCount: 12 },
  ]),
  async (req, res) => {
    const {userId, serviceName, servicePrice, startDate, endDate, description } = req.body;


    const image = req.files["image"] ? req.files["image"][0] : null;
    const multipleImages = req.files["multipleImages"] || [];

    console.log('Service Name:', serviceName);
    console.log('Service Price:', servicePrice);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('Description:', description);
    console.log('Showcase Image:', image);
    console.log('Images:', multipleImages);

    try {
      if (
        !image ||
        !serviceName ||
        !description ||
        !servicePrice       ) {
        return res.status(422).send("Please Fill All Fields!");
      }

      const result = await cloudinary.uploader.upload(image.path, {
        folder: "products",
      });

      const multipleImagesResults = await Promise.all(
        multipleImages.map(async (file) => {
          const res = await cloudinary.uploader.upload(file.path, {
            folder: "services",
          });
          return {
            public_id: res.public_id,
            url: res.secure_url,
          };
        })
      );

      const service = await Services.create({
        image: {
          public_id: result.public_id,
          url: result.secure_url,
        },
        multipleImages: multipleImagesResults,
        userId,
        serviceName,
        description,
        servicePrice,
        startDate,
        endDate,
      });

      res.status(200).send("create-service Posted Successfully");
    } catch (error) {
      console.error("error", error);
      res.status(500).send("create-service Internal Server error!");
    }
  }
);

router.get("/getServices", async (req, res) => {
  try {
    const services = await Services.find().populate({
      path: 'userId',
      select: 'userName'
    });
    console.log("services", services)
    res.json({ services });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});


router.get("/getServicesByuserId/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const services = await Services.find({userId}).populate({
      path: 'userId',
      select: 'userName'
    });
    console.log("services", services)
    res.json({ services });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});
router.put('/update-status/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const service = await Services.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.status = status;
    await service.save();

    res.status(200).json({ message: 'Service status updated', service });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.put('/update-product-status/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'product not found' });
    }

    product.status = status;
    await product.save();

    res.status(200).json({ message: 'product status updated', product });
  } catch (error) {
    res.status(500).json({ message: 'product error', error });
  }
});

router.delete("/deleteServices/:id", async (req, res) => {
    const { id } = req.params;
    console.log("id:", id);
    try {
      await Services.deleteOne({ _id: id });
      res.sendStatus(204);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "deleteServices Internal server error" });
    }
  }
);


router.post("/update-service/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "multipleImages", maxCount: 12 },
  ]),
  async (req, res) => {
    const {serviceName, servicePrice, startDate, endDate, description } = req.body;
    const { id } = req.params;

    const image = req.files["image"] ? req.files["image"][0] : null;
    const multipleImages = req.files["multipleImages"] || [];

    try {
      if (!serviceName || !description || !servicePrice) {
        return res.status(422).send("Please Fill All Required Fields!");
      }

      let imageResult = {};
      if (image) {
        imageResult = await cloudinary.uploader.upload(image.path, {
          folder: "services",
        });
      }

      let multipleImagesResults = [];
      if (multipleImages.length > 0) {
        multipleImagesResults = await Promise.all(
          multipleImages.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "services",
            });
            return {
              public_id: result.public_id,
              url: result.secure_url,
            };
          })
        );
      }

      const updatedService = await Services.findByIdAndUpdate(id, {
        serviceName,
        servicePrice,
        startDate,
        endDate,
        description,
        image: imageResult ? { public_id: imageResult.public_id, url: imageResult.secure_url } : null,
        multipleImages: multipleImagesResults,
      }, { new: true });

      if (!updatedService) {
        return res.status(404).send("Service not found!");
      }

      res.status(200).json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).send("Internal Server Error!");
    }
  }
);

router.post('/vendor-profile', async (req, res) => {
  const { name, userId, email, contact, businessType, description, address, pickupAddress, city, postalCode } = req.body;
 // Log all fields
 console.log('name:', name);
 console.log('userId:', userId);
 console.log('email:', email);
 console.log('contact:', contact);
 console.log('businessType:', businessType);
 console.log('description:', description);
 console.log('address:', address);
 console.log('pickupAddress:', pickupAddress);
 console.log('city:', city);
 console.log('postalCode:', postalCode);
  if (!name || !email || !contact || !businessType || !address || !pickupAddress || !city || !postalCode) {
      return res.status(422).json({ error: 'Please fill in all required fields.' });
  }

  try {
      const newVendorProfile = new VendorProfile({
          businessName: name,
          userId:userId,
          businessEmail: email,
          businessContact: contact,
          businessType,
          businessDescription: description,
          businessAddress: address,
          pickupAddress,
          city,
          postalCode,
      });

      const savedProfile = await newVendorProfile.save();
      res.status(200).json(savedProfile);
  } catch (error) {
      console.error('Error saving vendor profile:', error);
      res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get("/getVenders", async (req, res) => {
  try {
    const venders = await VendorProfile.find().populate({
      path: 'userId',
      select: 'userName'
    });
    console.log("venders:", venders)
    res.json({ venders });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});

router.put('/updateVender-status/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const vernder = await VendorProfile.findById(id);
    if (!vernder) {
      return res.status(404).json({ message: 'vernder not found' });
    }

    vernder.status = status;
    await vernder.save();

    res.status(200).json({ message: 'vernder status updated', vernder });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.delete("/deleteVender/:id", async (req, res) => {
  const { id } = req.params;
  console.log("id:", id);
  try {
    await VendorProfile.deleteOne({ _id: id });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "deleteVender Internal server error" });
  }
}
);

router.get("/getUsers", async (req, res) => {
  try {
    const users = await User.find();
    console.log("users:", users)
    res.json({ users });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});
module.exports = router;
