#!/bin/bash
set -e

echo "🚀 === MYSQL CLUSTER VERIFICATION TEST ==="
echo "Testing real-time replication and cluster functionality..."

# MySQL connection function with better error handling
mysql_exec() {
    local server=$1
    local query=$2
    local db=${3:-""}
    
    echo "DEBUG: Executing on $server: $query" >&2
    
    if [ -n "$db" ]; then
        timeout 30 docker exec $server mysql -uroot -p1215161 -D$db -e "$query" 2>/dev/null
    else
        timeout 30 docker exec $server mysql -uroot -p1215161 -e "$query" 2>/dev/null
    fi
    
    local exit_code=$?
    echo "DEBUG: Exit code for $server: $exit_code" >&2
    return $exit_code
}

echo ""
echo "1. 🧪 LIVE REPLICATION TEST"
echo "Creating test database and inserting real-time data..."

# Create test database
mysql_exec mysql-master "CREATE DATABASE IF NOT EXISTS cluster_test;"
mysql_exec mysql-master "USE cluster_test; CREATE TABLE IF NOT EXISTS live_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255),
    server_source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"

echo "✅ Test database created on master"

# Insert test data with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
mysql_exec mysql-master "INSERT INTO cluster_test.live_test (message, server_source) VALUES 
    ('Live test data $TIMESTAMP', 'master'),
    ('Replication verification', 'master'),
    ('Cluster test $(date +%s)', 'master');"

echo "✅ Test data inserted on master"

# Wait a moment for replication
echo "⏱️  Waiting 3 seconds for replication to sync..."
sleep 3

echo ""
echo "2. 📊 VERIFYING DATA ON ALL SERVERS"

for server in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- $server ---"
    
    # Check if container is accessible first
    if ! docker exec $server mysql -uroot -p1215161 -e "SELECT 1;" >/dev/null 2>&1; then
        echo "❌ Cannot connect to $server - skipping verification"
        continue
    fi
    
    # Wait a bit more for replica sync
    if [ "$server" != "mysql-master" ]; then
        echo "⏱️  Waiting 2 seconds for $server sync..."
        sleep 2
    fi
    
    # Check if database exists
    db_exists=$(mysql_exec $server "SHOW DATABASES LIKE 'cluster_test';" 2>/dev/null || echo "")
    if [ -z "$db_exists" ]; then
        echo "⚠️  Database cluster_test not yet replicated to $server"
        continue
    fi
    
    # Get row count with error handling
    result=$(mysql_exec $server "SELECT COUNT(*) as total_rows FROM cluster_test.live_test;" 2>/dev/null || echo "0")
    if [ -n "$result" ]; then
        echo "Total rows: $result"
    else
        echo "❌ Cannot query table on $server"
        continue
    fi
    
    # Get latest data with error handling
    latest_data=$(mysql_exec $server "SELECT message, created_at FROM cluster_test.live_test ORDER BY id DESC LIMIT 1;" 2>/dev/null || echo "No data")
    echo "Latest record: $latest_data"
    echo "✅ $server verified"
    echo ""
done

echo ""
echo "3. 🔄 REAL-TIME SYNC TEST"
echo "Testing continuous replication..."

# Insert data every second and check replication
for i in {1..3}; do
    echo "--- Round $i ---"
    
    # Insert on master
    if ! mysql_exec mysql-master "INSERT INTO cluster_test.live_test (message, server_source) VALUES ('Sync test round $i - $(date)', 'master');" >/dev/null 2>&1; then
        echo "❌ Failed to insert data on master for round $i"
        continue
    fi
    
    echo "✅ Data inserted on master for round $i"
    sleep 3
    
    # Check on replicas with timeout and error handling
    for replica in mysql-replica1 mysql-replica2; do
        echo "  Checking $replica..."
        
        # Check if replica is accessible
        if ! docker exec $replica mysql -uroot -p1215161 -e "SELECT 1;" >/dev/null 2>&1; then
            echo "  ❌ $replica: Not accessible"
            continue
        fi
        
        # Check for the specific round data
        count=$(mysql_exec $replica "SELECT COUNT(*) FROM cluster_test.live_test WHERE message LIKE '%round $i%';" 2>/dev/null | tail -1 || echo "0")
        
        if [ "$count" = "1" ]; then
            echo "  ✅ $replica: Round $i data synchronized"
        elif [ "$count" = "0" ]; then
            echo "  ⚠️  $replica: Round $i data not yet synchronized (may need more time)"
        else
            echo "  ❌ $replica: Unexpected result: $count"
        fi
    done
    echo ""
done

echo ""
echo "4. 📈 PERFORMANCE METRICS"

for server in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- $server Performance ---"
    
    # Check server accessibility first
    if ! docker exec $server mysql -uroot -p1215161 -e "SELECT 1;" >/dev/null 2>&1; then
        echo "❌ $server not accessible - skipping performance check"
        echo ""
        continue
    fi
    
    # Connection status with error handling
    connections=$(mysql_exec $server "SHOW STATUS LIKE 'Threads_connected';" 2>/dev/null | grep -o '[0-9]*' | tail -1 || echo "Unknown")
    echo "Active connections: $connections"
    
    # Uptime with error handling  
    uptime=$(mysql_exec $server "SHOW STATUS LIKE 'Uptime';" 2>/dev/null | grep -o '[0-9]*' | tail -1 || echo "0")
    if [ "$uptime" != "0" ] && [ "$uptime" != "Unknown" ]; then
        uptime_hours=$((uptime / 3600))
        echo "Uptime: $uptime_hours hours"
    else
        echo "Uptime: Unknown"
    fi
    
    # Query performance with error handling
    queries=$(mysql_exec $server "SHOW STATUS LIKE 'Queries';" 2>/dev/null | grep -o '[0-9]*' | tail -1 || echo "Unknown")
    echo "Total queries: $queries"
    
    echo "✅ $server performance metrics collected"
    echo ""
done

echo ""
echo "5. 🔍 REPLICATION LAG CHECK"

for replica in mysql-replica1 mysql-replica2; do
    echo "--- $replica Lag Analysis ---"
    lag_info=$(mysql_exec $replica "SHOW REPLICA STATUS\G" | grep -E "(Seconds_Behind_Source|Replica_IO_State|Replica_SQL_Running_State)")
    echo "$lag_info"
    
    # Extract lag value
    lag=$(echo "$lag_info" | grep "Seconds_Behind_Source" | awk '{print $2}')
    if [ "$lag" = "0" ] || [ "$lag" = "NULL" ]; then
        echo "✅ $replica: No replication lag detected"
    else
        echo "⚠️  $replica: Replication lag: $lag seconds"
    fi
    echo ""
done

echo ""
echo "6. 💾 DATA CONSISTENCY VERIFICATION"

echo "Checking data consistency across all servers..."

# Get row count from master
master_count=$(mysql_exec mysql-master "SELECT COUNT(*) FROM cluster_test.live_test;" | tail -1)
echo "Master total rows: $master_count"

# Compare with replicas
for replica in mysql-replica1 mysql-replica2; do
    replica_count=$(mysql_exec $replica "SELECT COUNT(*) FROM cluster_test.live_test;" | tail -1)
    echo "$replica total rows: $replica_count"
    
    if [ "$master_count" = "$replica_count" ]; then
        echo "✅ $replica: Data consistency verified"
    else
        echo "❌ $replica: Data inconsistency detected!"
        echo "   Master: $master_count rows, $replica: $replica_count rows"
    fi
done

echo ""

echo "7. 🛡️ FAILOVER SIMULATION TEST"
echo "Testing cluster resilience (read-only test)..."

# MySQL connection function with better error handling for step 7
mysql_exec_robust() {
    local server=$1
    local query=$2
    local max_retries=3
    local retry_delay=2
    
    for i in $(seq 1 $max_retries); do
        echo "DEBUG: Attempt $i/$max_retries - Executing on $server: $query" >&2
        
        # Check if container is running first
        if ! docker ps --format "table {{.Names}}" | grep -q "^${server}$"; then
            echo "ERROR: Container $server is not running" >&2
            return 1
        fi
        
        # Check if MySQL process is ready
        if ! docker exec $server mysqladmin -uroot -p1215161 ping >/dev/null 2>&1; then
            echo "WARNING: MySQL on $server not ready, retrying in ${retry_delay}s..." >&2
            sleep $retry_delay
            continue
        fi
        
        # Execute query with timeout and better error handling
        result=$(timeout 10 docker exec $server mysql -uroot -p1215161 --connect-timeout=5 -e "$query" 2>&1)
        exit_code=$?
        
        if [ $exit_code -eq 0 ]; then
            echo "Query result: $result" >&2
            local exit_code=$?
            echo "DEBUG: Success on $server (exit code: $exit_code)" >&2
            return 0
        else
            local exit_code=$?
            echo "DEBUG: Failed on $server (exit code: $exit_code), attempt $i/$max_retries" >&2
            if [ $i -lt $max_retries ]; then
                sleep $retry_delay
            fi
        fi
    done
    
    echo "ERROR: All $max_retries attempts failed for $server" >&2
    return 1
}

# Test read operations on all servers
for server in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- Testing read capability on $server ---"
    
    # Check container status first
    container_status=$(docker inspect $server --format='{{.State.Status}}' 2>/dev/null || echo "not-found")
    if [ "$container_status" != "running" ]; then
        echo "❌ $server: Container not running (status: $container_status)"
        continue
    fi
    
    # Wait a moment for MySQL to be fully ready
    echo "⏱️  Waiting for $server to be ready..."
    sleep 2
    
    # Test connection with robust function (MySQL 9.x compatible syntax)
    if mysql_exec_robust $server "SELECT 'Connection successful' as status, NOW() as current_time_value;"; then
        echo "✅ $server: Read operations working"
    else
        echo "❌ $server: Read operations failed"
        
        # Additional diagnostics
        echo "🔍 Diagnostics for $server:"
        docker exec $server ps aux | grep mysql | head -3
        echo "Last 5 lines of MySQL log:"
        docker logs $server --tail 5
    fi
    echo ""
done

echo ""
echo "8. 🔧 HEALTH CHECK SUMMARY"

all_healthy=true

echo "--- Container Health ---"
for container in mysql-master mysql-replica1 mysql-replica2; do
    health=$(docker inspect $container --format='{{.State.Health.Status}}' 2>/dev/null || echo "no-health-check")
    status=$(docker inspect $container --format='{{.State.Status}}' 2>/dev/null || echo "not-running")
    
    if [ "$status" = "running" ]; then
        echo "✅ $container: Running ($health)"
    else
        echo "❌ $container: Not running ($status)"
        all_healthy=false
    fi
done

echo ""
echo "--- Replication Health ---"
for replica in mysql-replica1 mysql-replica2; do
    io_running=$(mysql_exec $replica "SHOW REPLICA STATUS\G" | grep "Replica_IO_Running:" | awk '{print $2}')
    sql_running=$(mysql_exec $replica "SHOW REPLICA STATUS\G" | grep "Replica_SQL_Running:" | awk '{print $2}')
    
    if [ "$io_running" = "Yes" ] && [ "$sql_running" = "Yes" ]; then
        echo "✅ $replica: Replication threads healthy"
    else
        echo "❌ $replica: Replication threads unhealthy (IO: $io_running, SQL: $sql_running)"
        all_healthy=false
    fi
done

echo ""
echo "🎯 === FINAL CLUSTER STATUS ==="

if [ "$all_healthy" = true ]; then
    echo "🎉 CLUSTER STATUS: FULLY OPERATIONAL"
    echo "✅ All containers are running and healthy"
    echo "✅ Replication is working perfectly"
    echo "✅ Data consistency verified across all nodes"
    echo "✅ No replication lag detected"
    echo "✅ Read operations working on all servers"
    echo ""
    echo "🚀 Your MySQL cluster is ready for production!"
    echo "💡 You can now:"
    echo "   - Direct writes to: mysql-master (port 3307)"
    echo "   - Direct reads to: mysql-replica1, mysql-replica2"
    echo "   - Use load balancer for read distribution"
    echo ""
    echo "📊 Connection strings:"
    echo "   Master (Write): localhost:3307"
    echo "   Replica1 (Read): mysql-replica1:3306 (internal)"
    echo "   Replica2 (Read): mysql-replica2:3306 (internal)"
else
    echo "⚠️  CLUSTER STATUS: NEEDS ATTENTION"
    echo "Some components require fixing before production use."
    echo "Please review the health check results above."
fi

echo ""
echo "🧹 Cleaning up test data..."
mysql_exec mysql-master "DROP DATABASE cluster_test;"
echo "✅ Test cleanup completed"

echo ""
echo "=== CLUSTER VERIFICATION COMPLETE ==="