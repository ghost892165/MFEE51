const express = require("express");
const cors = require("cors");

const app = express();
app.listen(8000);
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const mysql = require("mysql");
const conn = mysql.createConnection({
  user: "root",
  password: "",
  host: "localhost",
  database: "final_v1",
});

// 沒連上資料庫報錯
conn.connect(function (err) {
  console.log(err);
});

// 1.查詢所有clinic
app.get("/todo/clinic", function (req, res) {
  conn.query("select * from clinic", [], function (err, rows) {
    // 字串
    res.send(JSON.stringify(rows));
    // JSON
    // res.json(rows);
    console.log(rows);
  });
});

// 以下為查詢特定營業時段、營業星期、地區、專科的sql語法
//             18:00:00    Mon     1     1

// 資料庫更改前
// SELECT *
// FROM clinic
// JOIN clinicandsub on clinic.clinic_id = clinicandsub.clinic_id
// JOIN sub on clinicandsub.sub_id = sub.sub_id
// WHERE FIND_IN_SET('Mon',clinic_date)
// 	AND '18:00:00' BETWEEN clinic_startTime AND clinic_endTime
// 	AND location_id = 1
//  AND sub.sub_id = 1

// 更改後
// SELECT *
// FROM clinic
// JOIN clinicandsub on clinic.id = clinicandsub.clinic_id
// JOIN sub on clinicandsub.sub_id = sub.id
// WHERE FIND_IN_SET('Mon',day)
// 	AND '18:00:00' BETWEEN startTime AND endTime
// 	AND location_id = 1
//  AND sub.id = 1

// 最終版本(X)，沒過濾，會出現重複
// SELECT
// 	clinic.address AS clinic_address,
//     clinic.name AS clinic_name,
//     sub.name AS sub_name,
//     doctor.picture AS doctor_picture,
//     doctor.sub AS doctor_sub,
//     doctor.name AS doctor_name,
//     doctor.seniority AS doctor_seniority,
//     doctor.info AS doctor_info
// FROM clinic
// INNER JOIN location ON clinic.location_id = location.id
// INNER JOIN clinicandsub ON clinic.id = clinicandsub.clinic_id
// INNER JOIN sub ON clinicandsub.sub_id = sub.id
// INNER JOIN doctor ON clinic.id = doctor.clinic_id
// INNER JOIN clinicandctag ON clinic.id = clinicandctag.clinic_id
// INNER JOIN ctag ON clinicandctag.ctag_id = ctag.id
// WHERE FIND_IN_SET('Mon',day)
// 	AND '18:00:00' BETWEEN startTime AND endTime
// 	AND location_id = 1
//  AND sub.id = 1
//  AND ctag.id = 1

// 最終版本
// SELECT DISTINCT
//     clinic.address AS clinic_address,
//     clinic.name AS clinic_name,
//     sub.name AS sub_name,
//     doctor.picture AS doctor_picture,
//     doctor.sub AS doctor_sub,
//     doctor.name AS doctor_name,
//     doctor.seniority AS doctor_seniority,
//     doctor.info AS doctor_info
// FROM clinic
// INNER JOIN location ON clinic.location_id = location.id
// INNER JOIN clinicandsub ON clinic.id = clinicandsub.clinic_id
// INNER JOIN sub ON clinicandsub.sub_id = sub.id
// INNER JOIN doctor ON clinic.id = doctor.clinic_id
// INNER JOIN clinicandctag ctag1 ON clinic.id = ctag1.clinic_id
// INNER JOIN clinicandctag ctag3 ON clinic.id = ctag3.clinic_id
// WHERE FIND_IN_SET('Mon', day) > 0
//     AND '18:00:00' BETWEEN startTime AND endTime
//     AND location_id = 1
//     AND sub.id = 1
//     AND ctag1.ctag_id = 1
//     AND ctag3.ctag_id = 3
// GROUP BY clinic.id, doctor.id

// 2.查詢特定營業星期、營業時段、地區、專科、標籤的診所和醫師
// 缺點，只能全部條件都有才能搜尋，希望能改成先點標籤再確認鍵，所以要加確認鍵

// 查詢營業星期為一且18點營業且地區在台北且心臟科且24小時營業和的診所和醫師
// 共12筆資料，沒加ctag條件為19筆
// http://localhost:8000/clinics?day=Mon&time=18:00:00&location=1&subId=1&ctagId=1

// app.get("/clinics", function (req, res) {
//   const { day, time, location, subId, ctagId } = req.query;
//   let query = `
//       SELECT
//         clinic.address AS clinic_address,
//         clinic.name AS clinic_name,
//         sub.name AS sub_name,
//         doctor.picture AS doctor_picture,
//         doctor.sub AS doctor_sub,
//         doctor.name AS doctor_name,
//         doctor.seniority AS doctor_seniority,
//         doctor.info AS doctor_info
//       FROM clinic
//         INNER JOIN location ON clinic.location_id = location.id
//         INNER JOIN clinicandsub ON clinic.id = clinicandsub.clinic_id
//         INNER JOIN sub ON clinicandsub.sub_id = sub.id
//         INNER JOIN doctor ON clinic.id = doctor.clinic_id
//         INNER JOIN clinicandctag ON clinic.id = clinicandctag.clinic_id
//         INNER JOIN ctag ON clinicandctag.ctag_id = ctag.id
//       WHERE 1=1
//   `;
//   let queryParmas = [];

//   if (day) {
//     query += " AND FIND_IN_SET(?,day) > 0 ";
//     queryParmas.push(day);
//   }

//   if (time) {
//     query += " AND ? BETWEEN startTime AND endTime ";
//     queryParmas.push(time);
//   }

//   if (location) {
//     // 轉為整數，後面10代表10進制
//     const locationInt = parseInt(location, 10);
//     if (!isNaN(locationInt)) {
//       query += " AND location_id = ? ";
//       queryParmas.push(locationInt);
//     }
//   }

//   if (subId) {
//     const subIdInt = parseInt(subId, 10);
//     if (!isNaN(subIdInt)) {
//       query += " AND sub.id = ? ";
//       queryParmas.push(subIdInt);
//     }
//   }
//   if (ctagId) {
//     const ctagIdInt = parseInt(ctagId, 10);
//     if (!isNaN(ctagIdInt)) {
//       query += " AND ctag.id = ? ";
//       queryParmas.push(ctagIdInt);
//     }
//   }
//   console.log("Query:", query);
//   console.log("Parameters:", queryParmas);

//   conn.query(query, queryParmas, function (err, rows) {
//     if (err) {
//       console.error("Error executing query:", err);
//       res.status(500).send("Internal Server Error");
//       return;
//     }
//     console.log(rows);

//     // res.send(JSON.stringify(rows));
//     res.json(rows);
//   });
// });

app.get("/clinics", function (req, res) {
  // http://localhost:8000/clinics?day=Mon&time=18:00:00&location=1&subId=1&ctagId=1
  const { day, time, location, subId, ctagId } = req.query;
  // AS左 = 要找的欄位 ； AS右 = 給予的別名
  // GROUP_CONCAT：將ctag的id合併成一個字串，並命名為ctags，DISTINCT為確保不重複
  // 使用INNER JOIN來連接相關的表，後面是連結條件
  // 如第一行：連結location資料表，在clinic的location_id和location.id一樣時
  // 使用LEFT JOIN來連接clinicandctag和ctag表，LEFT JOIN允許即使沒有匹配的行也返回左側表的所有行。
  let query = `
      SELECT DISTINCT
        clinic.id AS clinic_id,
        clinic.address AS clinic_address,
        clinic.name AS clinic_name,
        sub.name AS sub_name,
        doctor.picture AS doctor_picture,
        doctor.sub AS doctor_sub,
        doctor.name AS doctor_name,
        doctor.seniority AS doctor_seniority,
        doctor.info AS doctor_info,
        doctor.id AS doctor_id,
        GROUP_CONCAT(DISTINCT ctag.id) AS ctags
      FROM clinic
        INNER JOIN location ON clinic.location_id = location.id
        INNER JOIN clinicandsub ON clinic.id = clinicandsub.clinic_id
        INNER JOIN sub ON clinicandsub.sub_id = sub.id
        INNER JOIN doctor ON clinic.id = doctor.clinic_id
        LEFT JOIN clinicandctag ON clinic.id = clinicandctag.clinic_id
        LEFT JOIN ctag ON clinicandctag.ctag_id = ctag.id
      WHERE 1=1
  `;
  // 空字串儲存查詢參數，?後面那一大堆
  let queryParams = [];
  // 找特定的字串，因為我day是設為['Mon','Tue']這樣的形式
  if (day) {
    query += " AND FIND_IN_SET(?, day) > 0 ";
    queryParams.push(day);
  }
  // 找在開始和結束時間的時間
  if (time) {
    query += " AND ? BETWEEN startTime AND endTime ";
    queryParams.push(time);
  }
  // 要先轉整數
  if (location) {
    const locationInt = parseInt(location, 10);
    if (!isNaN(locationInt)) {
      query += " AND location_id = ? ";
      queryParams.push(locationInt);
    }
  }

  if (subId) {
    const subIdInt = parseInt(subId, 10);
    if (!isNaN(subIdInt)) {
      query += " AND sub.id = ? ";
      queryParams.push(subIdInt);
    }
  }
  // split：以逗點作為分隔號將ctagId分割成一個數組
  // map：把每個數組中的元素用parseInt轉換成十進位整數
  // filter：過濾掉不是有效數字的元素
  let ctagIds = [];
  if (ctagId) {
    ctagIds = ctagId
      .split(",")
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));
    if (ctagIds.length > 0) {
      query += " AND ctag.id IN (?) ";
      queryParams.push(ctagIds);
    }
  }
  // GROUP BY：將查詢結果分組，先分成診所再來是醫生
  query += " GROUP BY clinic.id, doctor.id ";

  // 如果有多個 ctagId，添加 HAVING 子句來確保診所擁有所有指定的 ctag
  if (ctagIds.length > 1) {
    query += " HAVING COUNT(DISTINCT ctag.id) = ? ";
    queryParams.push(ctagIds.length);
  }

  console.log("Query:", query);
  console.log("Parameters:", queryParams);

  conn.query(query, queryParams, function (err, rows) {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    console.log("Query results:", rows);

    res.json(rows);
  });
});

// 3.預約單新增
// INSERT INTO appointment ( pet_id, clinic_id, status )
// VALUES ( 1, 2, 'ok');
app.post("/clinics/appointment", function (req, res) {
  conn.query(
    "INSERT INTO appointment ( pet_id, clinic_id, status, doctor_id ) VALUES ( ?, ?, 'ok', ?)",
    [req.body.pet, req.body.clinic, req.body.doctor],
    function (err, rows) {
      res.send(JSON.stringify(req.body));
    }
  );
});

// 4. 預約數據的保存

app.post("/create-appointment", function (req, res) {
  const { clinicId, doctorId, appointmentDate, appointmentTime, petId } =
    req.body;

  // 生成一個唯一的預約 ID
  const appointmentId = Date.now().toString();

  const query = `
    INSERT INTO appointments 
    (id, clinic_id, doctor_id, appointment_date, appointment_time, pet_id, status) 
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;

  conn.query(
    query,
    [
      appointmentId,
      clinicId,
      doctorId,
      appointmentDate,
      appointmentTime,
      petId,
    ],
    function (err, result) {
      if (err) {
        console.error("Error creating appointment:", err);
        res.status(500).json({ error: "Failed to create appointment" });
      } else {
        res.json({ appointmentId: appointmentId });
      }
    }
  );
});

app.get("/appointment/:id", function (req, res) {
  const appointmentId = req.params.id;

  // 使用 JOIN 查詢來獲取更多相關信息
  const query = `
    SELECT 
      a.id, a.appointment_date, a.appointment_time, a.status,
      c.name AS clinic_name, c.address AS clinic_address,
      d.name AS doctor_name, d.sub AS doctor_specialty
    FROM appointments a
    JOIN clinic c ON a.clinic_id = c.id
    JOIN doctor d ON a.doctor_id = d.id
    WHERE a.id = ?
  `;

  conn.query(query, [appointmentId], function (err, results) {
    if (err) {
      console.error("Error fetching appointment:", err);
      res.status(500).json({ error: "Failed to fetch appointment details" });
    } else if (results.length === 0) {
      res.status(404).json({ error: "Appointment not found" });
    } else {
      res.json(results[0]);
    }
  });
});

// 獲取所有寵物
app.get("/pets", (req, res) => {
  const query = "SELECT id, name, picture FROM pets";
  conn.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching pets:", error);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// 獲取特定用戶的寵物
app.get("/pets/user/:userId", (req, res) => {
  const userId = req.params.userId;
  const query = "SELECT id, name, picture FROM pets WHERE owner_id = ?";
  conn.query(query, [userId], (error, results) => {
    if (error) {
      console.error("Error fetching user's pets:", error);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// 獲取單個寵物的詳細信息
app.get("/pets/:petId", (req, res) => {
  const petId = req.params.petId;
  const query = "SELECT * FROM pets WHERE id = ?";
  conn.query(query, [petId], (error, results) => {
    if (error) {
      console.error("Error fetching pet details:", error);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Pet not found" });
    }
    res.json(results[0]);
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});
