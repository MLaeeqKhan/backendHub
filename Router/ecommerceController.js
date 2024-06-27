const express = require("express");
const router = express.Router();
const cloudinary = require("../Middleware/cloudinay");
const Product = require("../Models/EcommerceModels/ProductSchema");
const ProductReview = require("../Models/EcommerceModels/ProductReviewsSchema");
const AddToCart = require("../Models/EcommerceModels/AddToCartSchema");
const Order = require("../Models/EcommerceModels/OrderFormSchema");
const Services = require("../Models/EcommerceModels/ServicesSchema");
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

// Delete products by product ID
router.delete("/deleteProducts/:productId", async (req, res) => {
  const { productId } = req.params;
  console.log("productId:", productId);
  try {
    await Product.deleteOne({ _id: productId });
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
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

module.exports = router;
