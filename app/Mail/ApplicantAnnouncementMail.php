<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicantAnnouncementMail extends Mailable
{
    use Queueable, SerializesModels;

    public $applicantName;
    public $subject;
    public $messageText;

    /**
     * Create a new message instance.
     */
    public function __construct($applicantName, $subject, $messageText)
    {
        $this->applicantName = $applicantName;
        $this->subject = $subject;
        $this->messageText = $messageText;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.applicant_announcement',
        );
    }
}
