const express = require("express");
const { Todo } = require("../mongo");
const router = express.Router();
const redis = require("../redis");

/* GET todos listing. */
router.get("/", async (_, res) => {
    const todos = await Todo.find({});
    res.send(todos);
});

/* POST todo to listing. */
router.post("/", async (req, res) => {
    const todo = await Todo.create({
        text: req.body.text,
        done: false,
    });
    res.send(todo);
    let addedTodos = await redis.getAsync("added_todos");
    if (!addedTodos) addedTodos = 0;
    await redis.setAsync("added_todos", parseInt(addedTodos) + 1);
});

router.get("/statistics", async (req, res) => {
    console.log("XD");
    const addedTodos = await redis.getAsync("added_todos");
    if (!addedTodos) res.send("No added todos");
    else res.json({ added_todos: addedTodos });
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
    console.log(req);
    const { id } = req.params;
    req.todo = await Todo.findById(id);
    if (!req.todo) return res.sendStatus(404);

    next();
};

/* DELETE todo. */
singleRouter.delete("/", async (req, res) => {
    await req.todo.delete();
    res.sendStatus(200);
});

/* GET todo. */
singleRouter.get("/", async (req, res) => {
    try {
        const toDo = await Todo.findById(req.todo);
        res.send(toDo);
    } catch (e) {
        res.sendStatus(405); // Implement this
    }
});

/* PUT todo. */
singleRouter.put("/", async (req, res) => {
    try {
        const newToDo = await Todo.findByIdAndUpdate(req.todo._id, req.body, {
            new: true,
        });
        console.log(newToDo);
        res.send(newToDo);
    } catch (e) {
        res.sendStatus(405); // Implement this
    }
});

router.use("/:id", findByIdMiddleware, singleRouter);

module.exports = router;
