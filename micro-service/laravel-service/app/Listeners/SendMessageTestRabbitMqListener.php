<?php

namespace App\Listeners;

use Illuminate\Support\Facades\Log;
use PhpAmqpLib\Message\AMQPMessage;
use App\Events\SendMessageTestRabbitMq;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use PhpAmqpLib\Connection\AMQPStreamConnection;

class SendMessageTestRabbitMqListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(SendMessageTestRabbitMq $event): void
    {
        try {
            $connection = new AMQPStreamConnection(
                'rabbitmq',5672,'user','password'
            );
            Log::info('Connected to RabbitMq');
            $channel = $connection->channel();

            $channel->set_ack_handler(
                function (AMQPMessage $message) {
                    Log::info("Message acknowledged by RabbitMQ: " . $message->body);
                }
            );

            $channel->set_nack_handler(
                function (AMQPMessage $message) {
                    Log::error("Message not acknowledged by RabbitMQ: " . $message->body);
                }
            );

            // Aktifkan publisher confirms
            $channel->confirm_select();

            $channel->queue_declare('send-queue', false,false,false,false);

            $msg = new AMQPMessage($event->message);
            $channel->basic_publish($msg, '', 'send-queue');
            Log::info('Message Send to RabbitMq in laravel to express');
            Log::info('Complete');

            $channel->wait_for_pending_acks_returns();

            $channel->close();
            $connection->close();
        } catch (\Throwable $th) {
            Log::error('Error sending message to RabbitMq: '.$th->getMessage());
        }
    }
}
