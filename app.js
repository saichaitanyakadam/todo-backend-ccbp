const format = require("date-fns/format");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const isValid = require("date-fns/isValid");
const path = require("path");
const app = express();
app.use(express.json());

const statusList = ["TO DO", "IN PROGRESS", "DONE"];
const categoryList = ["WORK", "LEARNING", "HOME"];
const priorityList = ["HIGH", "MEDIUM", "LOW"];

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("listening at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Database error: ${e.message}`);
  }
};
initializeServerAndDB();

app.get("/todos/", async (request, response) => {
  const {
    category = "",
    priority = "",
    status = "",
    search_q = "",
  } = request.query;

  if (status !== "" && !statusList.includes(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priority !== "" && !priorityList.includes(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (category !== "" && !categoryList.includes(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    const sqlQuery = `
  select id,todo,priority,status,category,due_date as dueDate
  from todo
  where status like "%${status}%" and todo like "%${search_q}%" and priority like "%${priority}%" and category like "%${category}%"
  `;
    const dbResponse = await db.all(sqlQuery);
    response.send(dbResponse);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const sqlQuery = `
    select id,todo,priority,status,category,due_date as dueDate
    from todo
    where id=${todoId}
    `;
  const todoItem = await db.get(sqlQuery);
  response.send(todoItem);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateCheck = isValid(new Date(`${date}`));
  if (dateCheck) {
    const formattedDate = format(new Date(`${date}`), "yyyy-MM-dd");
    console.log(formattedDate);
    const sqlQuery = `
    select id,todo,priority,status,category,due_date as dueDate
    from todo
    where due_date="${formattedDate}"
    `;
    const dbResponse = await db.all(sqlQuery);
    response.send(dbResponse);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  if (!statusList.includes(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (!priorityList.includes(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (!categoryList.includes(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (!isValid(new Date(`${dueDate}`))) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formattedDate = format(new Date(`${dueDate}`), "yyyy-MM-dd");
    const sqlQuery = `
    insert into todo (id,todo,priority,status,category,due_date)
    values (${id},"${todo}","${priority}","${status}","${category}","${formattedDate}")
    `;
    await db.run(sqlQuery);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { todo, category, priority, status, dueDate } = todoDetails;
  let sqlQuery;
  let resultWord;
  switch (true) {
    case todo !== undefined:
      sqlQuery = `
        update todo
        set todo="${todo}"
        where id=${todoId}
        `;
      resultWord = "Todo";
      await db.run(sqlQuery);
      response.send(`${resultWord} Updated`);
      break;
    case category !== undefined:
      if (categoryList.includes(category)) {
        sqlQuery = `
        update todo
        set category="${category}"
        where id=${todoId}
        `;
        resultWord = "Category";
        await db.run(sqlQuery);
        response.send(`${resultWord} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case status !== undefined:
      if (statusList.includes(status)) {
        sqlQuery = `
        update todo
        set status="${status}"
        where id=${todoId}
        `;
        resultWord = "Status";
        await db.run(sqlQuery);
        response.send(`${resultWord} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priority !== undefined:
      if (priorityList.includes(priority)) {
        sqlQuery = `
        update todo
        set priority="${priority}"
        where id=${todoId}
        `;
        resultWord = "Priority";
        await db.run(sqlQuery);
        response.send(`${resultWord} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case dueDate !== undefined:
      if (isValid(new Date(`${dueDate}`))) {
        sqlQuery = `
        update todo
        set due_date="${dueDate}"
        where id=${todoId}
        `;
        resultWord = "Due Date";
        await db.run(sqlQuery);
        response.send(`${resultWord} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
    default:
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const sqlQuery = `
    delete from todo
    where id=${todoId}
    `;
  await db.run(sqlQuery);
  response.send("Todo Deleted");
});

module.exports = app;
