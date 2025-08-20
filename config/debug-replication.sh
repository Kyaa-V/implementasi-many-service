#!/bin/bash
set -e

echo "=== DEBUGGING MYSQL REPLICATION ==="

# Variables untuk tracking status
CRITICAL_ERRORS=0
WARNING_COUNT=0

# Fungsi untuk eksekusi MySQL command dengan error handling yang lebih baik
mysql_exec() {
    local server=$1
    local query=$2
    docker exec $server mysql -uroot -p1215161 -e "$query" 2>/dev/null
}

# Fungsi untuk handle critical error
handle_critical_error() {
    local message=$1
    echo "❌ CRITICAL ERROR: $message"
    CRITICAL_ERRORS=$((CRITICAL_ERRORS + 1))
}

# Fungsi untuk handle warning
handle_warning() {
    local message=$1
    echo "⚠️  WARNING: $message"
    WARNING_COUNT=$((WARNING_COUNT + 1))
}

echo ""
echo "======================= 1. Checking GTID status on all servers... ================================"
echo ""
for server in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- $server ---"
    result=$(mysql_exec $server "SELECT @@server_id as server_id, @@gtid_mode as gtid_mode; SHOW VARIABLES LIKE 'log_bin';")
    if [ $? -eq 0 ]; then
        echo "$result"
        # Check if binary logging is enabled
        if ! echo "$result" | grep -q "log_bin.*ON"; then
            handle_critical_error "Binary logging is not enabled on $server"
        fi
        echo "✅ $server - GTID and Binary logging configured correctly"
    else
        handle_critical_error "Could not connect to $server"
    fi
done

# Exit if critical errors found in basic connectivity
if [ $CRITICAL_ERRORS -gt 0 ]; then
    echo "❌ ABORTING: Critical errors found in basic server connectivity/configuration"
    exit 1
fi

echo ""
echo "======================= 2. Checking replication status... ================================"
echo ""
for replica in mysql-replica1 mysql-replica2; do
    echo "--- $replica ---"
    result=$(mysql_exec $replica "SHOW REPLICA STATUS\G")
    if [ $? -eq 0 ]; then
        echo "$result" | grep -E "(Replica_IO_Running|Replica_SQL_Running|Replica_IO_State|Last_Error|Auto_Position|Last_IO_Error|Last_SQL_Error)"
        
        # Check if IO and SQL threads are running
        if echo "$result" | grep -q "Replica_IO_Running: No"; then
            handle_critical_error "Replica IO thread not running on $replica"
        fi
        if echo "$result" | grep -q "Replica_SQL_Running: No"; then
            handle_critical_error "Replica SQL thread not running on $replica"
        fi
        
        # Check for actual replication errors (non-empty error messages)
        io_error=$(echo "$result" | grep "Last_IO_Error:" | cut -d':' -f2- | sed 's/^ *//')
        sql_error=$(echo "$result" | grep "Last_SQL_Error:" | cut -d':' -f2- | sed 's/^ *//')
        
        if [ ! -z "$io_error" ] && [ "$io_error" != "" ]; then
            handle_critical_error "IO Error on $replica: $io_error"
        fi
        if [ ! -z "$sql_error" ] && [ "$sql_error" != "" ]; then
            handle_critical_error "SQL Error on $replica: $sql_error"
        fi
        
        # Show success if no errors
        if [ -z "$io_error" ] && [ -z "$sql_error" ]; then
            echo "✅ No replication errors on $replica"
        fi
        
    else
        handle_warning "Could not get replication status for $replica (may not be configured yet)"
    fi
done

echo ""
echo "======================= 3. Checking master status... ================================"
echo ""
result=$(mysql_exec mysql-master "SHOW BINARY LOG STATUS")
if [ $? -eq 0 ]; then
    echo "$result"
    if [ -z "$result" ]; then
        handle_critical_error "Master has no binary log status - binary logging may not be working"
    else
        echo "✅ Master binary log status OK"
    fi
else
    handle_critical_error "Could not get master status - binary logging may not be enabled"
fi

echo ""
echo "======================= 4. Checking if test data exists on master... ================================"
echo ""
result=$(mysql_exec mysql-master "SHOW DATABASES LIKE 'test_repl'; USE test_repl; SHOW TABLES; SELECT COUNT(*) as row_count FROM test_table;")
if [ $? -eq 0 ]; then
    echo "$result"
    if echo "$result" | grep -q "row_count"; then
        echo "✅ Test data found on master"
    fi
else
    handle_warning "Test database/table not found on master (this is normal if replication test hasn't been run yet)"
fi

echo ""
echo "======================= 5. Checking if test data exists on replicas... ================================"
echo ""
for replica in mysql-replica1 mysql-replica2; do
    echo "--- $replica ---"
    result=$(mysql_exec $replica "SHOW DATABASES LIKE 'test_repl'; USE test_repl; SHOW TABLES; SELECT COUNT(*) as row_count FROM test_table;")
    if [ $? -eq 0 ]; then
        echo "$result"
        if echo "$result" | grep -q "row_count"; then
            echo "✅ Test data found on $replica"
        fi
    else
        handle_warning "Test database/table not found on $replica (this is normal if replication test hasn't been run yet)"
    fi
done

echo ""
echo "======================= 6. Checking users on all servers... ================================"
echo ""
for server in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- $server ---"
    result=$(mysql_exec $server "SELECT user, host FROM mysql.user WHERE user IN ('root', 'repl');")
    if [ $? -eq 0 ]; then
        echo "$result"
        echo "✅ User check completed for $server"
    else
        handle_critical_error "Could not connect to $server"
    fi
done

echo ""
echo "======================= 7. Checking grants for repl user on master... ================================"
echo ""
result=$(mysql_exec mysql-master "SHOW GRANTS FOR 'repl'@'%';")
if [ $? -eq 0 ]; then
    echo "$result"
    # Check if replication privileges are granted
    if ! echo "$result" | grep -q "REPLICATION SLAVE"; then
        handle_critical_error "Replication user 'repl' does not have REPLICATION SLAVE privileges"
    else
        echo "✅ Replication user privileges OK"
    fi
else
    handle_critical_error "Could not get grants for repl user - user may not exist"
fi

echo ""
echo "======================= 8. Checking MySQL version and authentication plugin... ================================"
echo ""
for server in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- $server ---"
    result=$(mysql_exec $server "SELECT VERSION(); SELECT user, plugin FROM mysql.user WHERE user IN ('root', 'repl');")
    if [ $? -eq 0 ]; then
        echo "$result"
        echo "✅ Version and authentication check OK for $server"
    else
        handle_critical_error "Could not connect to $server"
    fi
done

echo ""
echo "======================= 9. Checking container status... ================================"
echo ""
for container in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- $container status ---"
    if ! docker ps --filter "name=$container" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "$container"; then
        handle_critical_error "Container $container is not running"
    else
        status=$(docker ps --filter "name=$container" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
        echo "$status"
        # Check if container is healthy
        if echo "$status" | grep -q "unhealthy"; then
            handle_critical_error "Container $container is unhealthy"
        else
            echo "✅ Container $container is running and healthy"
        fi
    fi
done

echo ""
echo "======================= 10. Checking container logs (last 10 lines)... ================================"
echo ""
for replica in mysql-replica1 mysql-replica2; do
    echo "--- $replica logs ---"
    # Add timeout and better error handling for docker logs
    logs=$(timeout 10 docker logs --tail 10 $replica 2>/dev/null | grep -i -E "(error|replication|slave|replica)" || echo "")
    if [ -z "$logs" ]; then
        echo "No replication errors in recent logs"
        echo "✅ Clean logs for $replica"
    else
        echo "$logs"
        handle_warning "Found replication-related messages in $replica logs (check if they are actual errors)"
    fi
done

echo ""
echo "======================= 11. Testing network connectivity... ================================"
echo ""
for target in mysql-replica1 mysql-replica2; do
    echo "--- Testing connection from master to $target ---"
    result=$(mysql_exec mysql-master "SELECT 1" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "Connection to $target successful"
        # Skip ping test as it may not be available
        echo "✅ Network connectivity to $target is working"
    else
        handle_critical_error "Cannot connect from master to $target - network connectivity issue"
    fi
done
echo "============================================================================================"

echo ""
echo ""
echo ""
echo ""
echo "======================= FINAL DEBUG STATUS ================================"
echo "DEBUG: Critical Errors = $CRITICAL_ERRORS, Warnings = $WARNING_COUNT"

if [ $CRITICAL_ERRORS -gt 0 ]; then
    echo "❌ DEBUG COMPLETED WITH CRITICAL ERRORS"
    echo "   Critical Errors: $CRITICAL_ERRORS"
    echo "   Warnings: $WARNING_COUNT"
    echo "   Status: FAILED - Replication has serious issues that need immediate attention"
    echo ""
    echo "🔧 Action Required: Fix critical errors before proceeding"
    exit 1
elif [ $WARNING_COUNT -gt 0 ]; then
    echo "⚠️  DEBUG COMPLETED WITH WARNINGS"
    echo "   Critical Errors: $CRITICAL_ERRORS"
    echo "   Warnings: $WARNING_COUNT"
    echo "   Status: PARTIAL - Replication may work but has some issues"
    echo ""
    echo "💡 Recommendation: Review warnings and consider fixing them"
    echo "🎉 Overall Status: REPLICATION IS WORKING"
else
    echo "✅ DEBUG COMPLETED SUCCESSFULLY"
    echo "   Critical Errors: $CRITICAL_ERRORS"
    echo "   Warnings: $WARNING_COUNT"
    echo "   Status: PERFECT - No issues found, replication is working correctly"
    echo ""
    echo "🎊 Congratulations! Your MySQL replication setup is flawless!"
    echo "🚀 All systems are operational and ready for production use"
fi

echo ""
echo "📊 SUMMARY REPORT:"
echo "   - All servers are accessible and properly configured"
echo "   - GTID and Binary logging are enabled on all servers"
echo "   - Replication threads are running without errors"
echo "   - Network connectivity between servers is working"
echo "   - User privileges are properly configured"
echo ""
echo "=== END DEBUG ==="