const express = require("express");
const router = express.Router();
const cloudinary = require("../Middleware/cloudinay");
const Product = require("../Models/EcommerceModels/ProductSchema");
const ProductReview = require("../Models/EcommerceModels/ProductReviewsSchema");
const AddToCart = require("../Models/EcommerceModels/AddToCartSchema");
const Order = require("../Models/EcommerceModels/OrderFormSchema");
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
    const { cart } = req.body.products; // Destructure cart from req.body.products
    console.log("cart:", cart);

    let userId='';
    const lineItems = cart.map((cartItem,index) => {
      const product = cartItem[index].productId; // Accessing productId from the first item in cartItem array

      const price = product.productPrice; // Accessing productPrice from productId
      const unitAmount = Math.round(price * 100);

      userId = product.userId;
      if (isNaN(unitAmount)) {
        throw new Error(
          `Invalid product price for product ID: ${product._id}`
        );
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
        quantity: cartItem[index].quantity, // Assuming the second item in cartItem is an object with quantity
      };
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
});router.post("/create-checkout-session", async (req, res) => {
  try {
    const { cart } = req.body.products; // Destructure cart from req.body.products
    console.log("cart:", cart);

    let userId = '';
    const lineItems = cart.flatMap((cartItem) => {
      return cartItem.map(item => {
        const product = item.productId; // Accessing productId from the item in cartItem array
        const price = product.productPrice; // Accessing productPrice from productId
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
          quantity: item.quantity, // Accessing quantity directly from item
        };
      });
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




module.exports = router;
