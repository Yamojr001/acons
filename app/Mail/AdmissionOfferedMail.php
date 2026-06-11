<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdmissionOfferedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $name;
    public $department;
    public $section;
    public $clearanceSchedule;

    /**
     * Create a new message instance.
     */
    public function __construct($name, $department, $section, $clearanceSchedule)
    {
        $this->name = $name;
        $this->department = $department;
        $this->section = $section;
        $this->clearanceSchedule = $clearanceSchedule;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Offer of Provisional Admission - ACONS',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.admission_offered',
        );
    }
}
