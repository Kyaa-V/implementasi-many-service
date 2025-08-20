#!/bin/bash

echo "=== DEBUGGING MYSQL REPLICATION ==="

# Fungsi untuk eksekusi MySQL command dengan error handling yang lebih baik
mysql_exec() {
    local server=$1
    local query=$2
    docker exec $server mysql -uroot -p1215161 -e "$query" 2>/dev/null
}

echo "1. Checking GTID status on all servers..."
for server in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- $server ---"
    result=$(mysql_exec $server "SELECT @@server_id as server_id, @@gtid_mode as gtid_mode; SHOW VARIABLES LIKE 'log_bin';")
    if [ $? -eq 0 ]; then
        echo "$result"
    else
        echo "Could not connect to $server"
    fi
done

echo ""
echo "2. Checking replication status..."
for replica in mysql-replica1 mysql-replica2; do
    echo "--- $replica ---"
    result=$(mysql_exec $replica "SHOW REPLICA STATUS\G")
    if [ $? -eq 0 ]; then
        echo "$result" | grep -E "(Replica_IO_Running|Replica_SQL_Running|Replica_IO_State|Last_Error|Auto_Position|Last_IO_Error|Last_SQL_Error)"
    else
        echo "Could not connect to $replica"
    fi
done

echo ""
echo "3. Checking master status..."
result=$(mysql_exec mysql-master "SHOW MASTER STATUS")
if [ $? -eq 0 ]; then
    echo "$result"
else
    echo "Could not get master status"
fi

echo ""
echo "4. Checking if test data exists on master..."
result=$(mysql_exec mysql-master "SHOW DATABASES LIKE 'test_repl'; USE test_repl; SHOW TABLES; SELECT COUNT(*) as row_count FROM test_table;")
if [ $? -eq 0 ]; then
    echo "$result"
else
    echo "Test database/table not found on master"
fi

echo ""
echo "5. Checking if test data exists on replicas..."
for replica in mysql-replica1 mysql-replica2; do
    echo "--- $replica ---"
    result=$(mysql_exec $replica "SHOW DATABASES LIKE 'test_repl'; USE test_repl; SHOW TABLES; SELECT COUNT(*) as row_count FROM test_table;")
    if [ $? -eq 0 ]; then
        echo "$result"
    else
        echo "Test database/table not found on $replica"
    fi
done

echo ""
echo "6. Checking users on all servers..."
for server in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- $server ---"
    result=$(mysql_exec $server "SELECT user, host FROM mysql.user WHERE user IN ('root', 'repl');")
    if [ $? -eq 0 ]; then
        echo "$result"
    else
        echo "Could not connect to $server"
    fi
done

echo ""
echo "7. Checking grants for repl user on master..."
result=$(mysql_exec mysql-master "SHOW GRANTS FOR 'repl'@'%';")
if [ $? -eq 0 ]; then
    echo "$result"
else
    echo "Could not get grants for repl user"
fi

echo ""
echo "8. Checking MySQL version and authentication plugin..."
for server in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- $server ---"
    result=$(mysql_exec $server "SELECT VERSION(); SELECT user, plugin FROM mysql.user WHERE user IN ('root', 'repl');")
    if [ $? -eq 0 ]; then
        echo "$result"
    else
        echo "Could not connect to $server"
    fi
done

echo ""
echo "9. Checking container status..."
for container in mysql-master mysql-replica1 mysql-replica2; do
    echo "--- $container status ---"
    status=$(docker ps --filter "name=$container" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
    echo "$status"
done

echo ""
echo "10. Checking container logs (last 10 lines)..."
for replica in mysql-replica1 mysql-replica2; do
    echo "--- $replica logs ---"
    docker logs --tail 10 $replica 2>/dev/null | grep -i -E "(error|replication|slave|replica)" || echo "No replication errors in recent logs"
done

echo ""
echo "11. Testing network connectivity..."
for target in mysql-replica1 mysql-replica2; do
    echo "--- Testing connection from master to $target ---"
    result=$(docker exec mysql-master mysql -uroot -p1215161 -h $target -e "SELECT 1" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "Connection to $target successful"
        docker exec mysql-master ping -c 1 $target 2>/dev/null || echo "Cannot ping $target"
    else
        echo "Cannot connect to $target"
    fi
done
echo "=== END DEBUG ==="