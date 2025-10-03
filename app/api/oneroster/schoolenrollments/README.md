# School Enrollments API

This API endpoint retrieves school enrollment records for a given student, optionally filtered by school year.

## Endpoint

`GET /api/oneroster/schoolenrollments`

### Query Parameters

- `studentId` (required): The unique identifier of the student.
- `schoolYear` (optional): The school year to filter enrollments. If omitted, all years are returned.

### Response

- `enrollments`: Array of enrollment objects for the student.
- `count`: Number of enrollments returned.
- `studentId`: The student ID used in the query.
- `schoolYear`: The school year used in the query, or "all" if not specified.

### Error Responses

- `400 Bad Request`: Missing required parameter `studentId`.
- `500 Internal Server Error`: Server error or data fetch failure.

## Example Usage

### Request

```
GET /api/oneroster/schoolenrollments?studentId=12345&schoolYear=2024
```

### Example using `fetch` in JavaScript

```js
fetch('/api/oneroster/schoolenrollments?studentId=12345&schoolYear=2024')
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.error('API Error:', data.error);
    } else {
      console.log('Enrollments:', data.enrollments);
      console.log('Count:', data.count);
    }
  });
```

### Example Response

```json
{
  "enrollments": [
    {
      "schoolId": "1001",
      "studentId": "12345",
      "schoolYear": "2024",
      "grade": "5"
    }
  ],
  "count": 1,
  "studentId": "12345",
  "schoolYear": "2024"
}
```

---

For more details, see the implementation in `app/api/oneroster/schoolenrollments/route.ts`.
