<?php

namespace App\Models;

/**
 * Backwards compatibility alias for Applicant.
 * All admission workflow data and logic have been unified into the `applicants` table.
 */
class AdmissionApplication extends Applicant
{
    protected $table = 'applicants';
}
