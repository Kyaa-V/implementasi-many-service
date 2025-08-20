#!/bin/bash
set -e

MASTER_HOST="mysql-master"
REPL_USER="repl"
REPL_PASS="replpassword"
ROOT_PASS="1215161"

echo "🚀 Starting replication setup..."

# Wait for services to be ready
echo "⏳ Waiting for all services to be ready..."
sleep 15

# Test connectivity dengan mysqladmin ping
for service in mysql-master mysql-replica1 mysql-replica2; do
    echo "Testing connectivity to $service..."
    until docker exec $service mysqladmin ping --user=root --password=$ROOT_PASS --silent 2>/dev/null; do
        echo "Waiting for $service to be ready..."
        sleep 3
    done
    echo "✅ $service is ready"
done

echo "🔧 Creating replication user on master..."
docker exec mysql-master mysql -uroot -p$ROOT_PASS -e "
  CREATE USER IF NOT EXISTS '$REPL_USER'@'%' IDENTIFIED WITH caching_sha2_password BY '$REPL_PASS';
  GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO '$REPL_USER'@'%';
  FLUSH PRIVILEGES;
"

echo "📊 Getting master status..."
MASTER_STATUS=$(docker exec mysql-master mysql -uroot -p$ROOT_PASS -e "SHOW MASTER STATUS;" --skip-column-names 2>/dev/null | head -n 1)

if [ -z "$MASTER_STATUS" ]; then
    echo "❌ Error: Could not get master status"
    exit 1
fi

echo "Master status: $MASTER_STATUS"

echo "⚙️ Configuring replicas with GTID..."
for replica in mysql-replica1 mysql-replica2; do
    echo "Configuring replication on $replica ..."
    docker exec $replica mysql -uroot -p$ROOT_PASS -e "
      STOP REPLICA;
      RESET REPLICA ALL;
      CHANGE REPLICATION SOURCE TO
        SOURCE_HOST='$MASTER_HOST',
        SOURCE_USER='$REPL_USER',
        SOURCE_PASSWORD='$REPL_PASS',
        SOURCE_AUTO_POSITION=1,
        GET_SOURCE_PUBLIC_KEY=1;
      START REPLICA;
    "
    echo "✅ Replication configured on $replica"
done

echo "🎉 Replication setup complete!"

# Verify replication status
echo "📋 Checking replication status..."
for replica in mysql-replica1 mysql-replica2; do
    echo "--- Status for $replica ---"
    docker exec $replica mysql -uroot -p$ROOT_PASS -e "
      SELECT
        CHANNEL_NAME,
        SERVICE_STATE as IO_State,
        SOURCE_HOST,
        SOURCE_USER,
        LAST_ERROR_MESSAGE
      FROM performance_schema.replication_connection_status;
      SELECT
        CHANNEL_NAME,
        SERVICE_STATE as SQL_State,
        LAST_ERROR_MESSAGE
      FROM performance_schema.replication_applier_status;
    " || echo "Could not get detailed status for $replica"
done

echo "🔍 Final verification - testing replication..."
docker exec mysql-master mysql -uroot -p$ROOT_PASS -e "
  CREATE DATABASE IF NOT EXISTS test_repl;
  USE test_repl;
  CREATE TABLE IF NOT EXISTS test_table (id INT PRIMARY KEY, name VARCHAR(50));
  INSERT INTO test_table VALUES (1, 'test_replication');
"

sleep 3

for replica in mysql-replica1 mysql-replica2; do
    echo "Checking test data on $replica..."
    RESULT=$(docker exec $replica mysql -uroot -p$ROOT_PASS -e "SELECT COUNT(*) as count FROM test_repl.test_table WHERE name='test_replication';" --skip-column-names 2>/dev/null || echo "0")
    if [ "$RESULT" = "1" ]; then
        echo "✅ Replication working on $replica"
    else
        echo "❌ Replication may have issues on $replica"
    fi
done

echo "🎊 Setup verification complete!"