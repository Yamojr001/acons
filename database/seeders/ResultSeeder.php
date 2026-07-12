<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\CourseRegistration;
use App\Models\Grade;

class ResultSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $tenant = Tenant::first();
        if (!$tenant) {
            $this->command->error('No tenant found!');
            return;
        }

        $registrations = CourseRegistration::where('tenant_id', $tenant->id)->get();
        $count = 0;

        foreach ($registrations as $reg) {
            $ca = rand(15, 30);
            $exam = rand(30, 70);
            $total = $ca + $exam;

            if ($total >= 70) { 
                $gradeLetter = 'A'; $gradePoints = 4.0; 
            } elseif ($total >= 60) { 
                $gradeLetter = 'B'; $gradePoints = 3.0; 
            } elseif ($total >= 50) { 
                $gradeLetter = 'C'; $gradePoints = 2.0; 
            } elseif ($total >= 45) { 
                $gradeLetter = 'D'; $gradePoints = 1.0; 
            } else { 
                $gradeLetter = 'F'; $gradePoints = 0.0; 
            }

            Grade::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'course_registration_id' => $reg->id,
                ],
                [
                    'ca_score' => $ca,
                    'exam_score' => $exam,
                    'total_score' => $total,
                    'grade_letter' => $gradeLetter,
                    'grade_points' => $gradePoints,
                    'is_absent' => false,
                    'approval_status' => 'submitted', // Sent to HOD
                    'rejection_reason' => null
                ]
            );

            // Clear cache
            \Illuminate\Support\Facades\Cache::forget('student_results_' . $reg->student_id);

            $count++;
        }

        $this->command->info("Seeded grades and submitted to HOD for {$count} course registrations.");
    }
}
