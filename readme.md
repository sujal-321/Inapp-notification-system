 Async Notification System:

A scalable, asynchronous notification system built using Node.js, React, PostgreSQL (Neon), Redis, and BullMQ.  
The system supports template-based notifications, background delivery with retries, admin monitoring, and user dashboards.

 System Architecture:

The system is designed using a queue-based asynchronous architecture to ensure performance, reliability, and scalability.

 High-level Flow

1. **Admin Dashboard (React)**
   - Creates notification templates
   - Selects users or broadcasts notifications
   - Triggers notification delivery

2. **Backend API (Express)**
   - Stores notification metadata in PostgreSQL
   - Enqueues delivery jobs into Redis
   - Returns immediately without waiting for delivery

3. **Redis + BullMQ**
   - Acts as the message queue
   - Guarantees reliable job delivery and locking

4. **Worker Process**
   - Consumes jobs asynchronously
   - Renders templates with user data
   - Handles retries and failures
   - Persists final notifications

5. **User Dashboard (React)**
   - Displays received notifications
   - Supports read/unread state

### Architecture Diagram (Conceptual)

Admin UI → API → PostgreSQL  
        ↓  
      Redis Queue  
        ↓  
      Worker  
        ↓  
    User Notifications  

This separation ensures the API remains fast while background workers handle delivery.



 Queue and Retry Logic:

Notification delivery is handled entirely in the background using BullMQ workers.

### Queue Behavior
- Each notification delivery is enqueued as a separate job
- Jobs contain lightweight references (notificationId, userId)
- Redis ensures atomic job locking and prevents duplicate processing

### Retry Strategy
- Maximum retries: 3 attempts
- Exponential backoff between retries
- Delivery states tracked in the database:
  - QUEUED → PROCESSING → SENT
  - RETRYING → FAILED (after max retries)

### Failure Handling
- Temporary failures are retried automatically
- Permanent failures are recorded and visible in the admin activity log
- Worker restarts do not cause job loss

This ensures fault tolerance and reliable delivery.

---




 Caching Strategy:

Redis is used as a queue and coordination layer, not as a primary data cache.

### Current Usage
- Redis stores:
  - Pending jobs
  - Retry metadata
  - Job locks
- PostgreSQL is the single source of truth for all persistent data

### Design Rationale
- Notification data must be durable and auditable
- Database persistence enables:
  - Activity logs
  - Delivery metrics
  - User notification history

### Future Improvements
- Cache frequently accessed templates
- Cache user lists for the admin dashboard
- Cache aggregated metrics

Demo Video:
https://drive.google.com/file/d/1aU6UN5YFjdEgon5vYRGm7MDVYf-vcl6c/view?usp=sharing

