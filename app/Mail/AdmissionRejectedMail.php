<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdmissionRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $name;
    public $reason;

    /**
     * Create a new message instance.
     */
    public function __construct($name, $reason)
    {
        $this->name = $name;
        $this->reason = $reason;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Admission Application Status Update - ACONS',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.admission_rejected',
        );
    }
}
