<?php

namespace App\Console\Commands;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use Illuminate\Console\Command;

class ConsumeRabbitMQ extends Command
{
    protected $signature = 'rabbitmq:consume';
    protected $description = 'Simple RabbitMQ consumer';

    public function handle()
    {
        $this->info('🚀 Starting consumer...');
        
        try {
            $connection = new AMQPStreamConnection(
                'rabbitmq', 5672, 'user', 'password'
            );
            $channel = $connection->channel();
            $queue = 'notification_register';

            $channel->queue_declare($queue, false, true, false, false);
            
            $this->info("✅ Connected! Waiting for messages...");
            $this->info("📝 Press CTRL+C to stop");
            
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

            // Loop sederhana tanpa timeout
            while (true) {
                if (count($channel->callbacks)) {
                    $channel->wait();
                } else {
                    sleep(1); // Tunggu sebentar jika tidak ada callback
                }
            }

        } catch (\Throwable $th) {
            $this->error('❌ Error: ' . $th->getMessage());
        }
    }
}