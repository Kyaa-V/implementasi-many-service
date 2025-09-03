<?php

namespace App\Console\Commands;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ConsumeRabbitMQ extends Command
{
    protected $signature = 'rabbitmq:consume';
    protected $description = 'Simple RabbitMQ consumer';

    public function handle()
    {
        Log::info('🚀 Starting consumer...');
        
        try {
            $connection = new AMQPStreamConnection(
                'rabbitmq', 5672, 'user', 'password'
            );
            $channel = $connection->channel();
            $queue = 'notification_register';

            $channel->queue_declare($queue, false, true, false, false);
            
            Log::info("✅ Connected! Waiting for messages...");
            Log::info("📝 Press CTRL+C to stop");
            
            $callback = function($msg) {
                $data = json_decode($msg->body, true);
                
                $this->info('📨 New notification received!');
                $this->line('   Type: ' . ($data['type'] ?? 'N/A'));
                $this->line('   Message: ' . ($data['message'] ?? $msg->body));
                $this->line('   Time: ' . date('H:i:s'));
                $this->line('   --------------------------------');
                
                // Simulasi processing
                sleep(1);
                $this->info('✅ Processed!');
            };

            $channel->basic_consume($queue, '', false, true, false, false, $callback);

            while($channel->is_consuming()){
                $channel->wait();
            }

        } catch (\Throwable $th) {
            Log::error('❌ Error: ' . $th->getMessage());
        }
    }
}