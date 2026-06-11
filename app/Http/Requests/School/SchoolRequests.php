<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

// ── Student ──────────────────────────────────────────────────────────────────
class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'name'          => 'required|string|max:100',
            'email'         => 'required|email|max:150',
            'phone'         => 'nullable|string|max:20',
            'class_room_id' => 'required|integer|exists:class_rooms,id',
            'date_of_birth' => 'required|date|before:today',
            'gender'        => 'required|in:male,female,other',
            'blood_group'   => 'nullable|string|max:5',
            'address'       => 'nullable|string|max:300',
        ];
    }
}

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'name'          => 'required|string|max:100',
            'phone'         => 'nullable|string|max:20',
            'class_room_id' => 'required|integer|exists:class_rooms,id',
            'status'        => 'required|in:active,graduated,suspended,withdrawn',
            'date_of_birth' => 'required|date',
            'gender'        => 'required|in:male,female,other',
            'blood_group'   => 'nullable|string|max:5',
            'address'       => 'nullable|string|max:300',
        ];
    }
}

// ── Teacher ───────────────────────────────────────────────────────────────────
class StoreTeacherRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'name'          => 'required|string|max:100',
            'email'         => 'required|email|max:150',
            'phone'         => 'nullable|string|max:20',
            'employee_id'   => 'required|string|max:20',
            'hire_date'     => 'required|date',
            'qualification' => 'nullable|string|max:200',
            'subject_ids'   => 'nullable|array',
            'subject_ids.*' => 'integer|exists:subjects,id',
            'class_ids'     => 'nullable|array',
            'class_ids.*'   => 'integer|exists:class_rooms,id',
        ];
    }
}

// ── Class Room ────────────────────────────────────────────────────────────────
class StoreClassRoomRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'name'          => 'required|string|max:50',
            'section'       => 'nullable|string|max:10',
            'capacity'      => 'required|integer|min:1|max:200',
            'academic_year' => 'required|string|max:20',
            'teacher_id'    => 'nullable|integer|exists:teachers,id',
        ];
    }
}

// ── Subject ───────────────────────────────────────────────────────────────────
class StoreSubjectRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'name'     => 'required|string|max:100',
            'code'     => 'nullable|string|max:20',
            'category' => 'nullable|string|max:50',
        ];
    }
}

// ── Exam ──────────────────────────────────────────────────────────────────────
class StoreExamRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'title'         => 'required|string|max:150',
            'class_room_id' => 'required|integer|exists:class_rooms,id',
            'subject_id'    => 'required|integer|exists:subjects,id',
            'term'          => 'required|in:first,second,third',
            'exam_date'     => 'required|date',
            'total_marks'   => 'required|integer|min:1|max:1000',
            'passing_marks' => 'required|integer|min:0|lte:total_marks',
            'description'   => 'nullable|string|max:500',
        ];
    }
}

// ── Fee ───────────────────────────────────────────────────────────────────────
class StoreFeeRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'title'         => 'required|string|max:150',
            'term'          => 'required|string|max:50',
            'amount'        => 'required|numeric|min:1',
            'due_date'      => 'required|date',
            'assign_to'     => 'required|in:individual,class,all',
            'student_id'    => 'required_if:assign_to,individual|nullable|integer|exists:students,id',
            'class_room_id' => 'required_if:assign_to,class|nullable|integer|exists:class_rooms,id',
        ];
    }
}

// ── Announcement ──────────────────────────────────────────────────────────────
class StoreAnnouncementRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'title'        => 'required|string|max:200',
            'body'         => 'required|string',
            'audience'     => 'required|in:all,teachers,students,parents',
            'send_email'   => 'boolean',
            'send_sms'     => 'boolean',
            'published_at' => 'nullable|date',
        ];
    }
}

// ── Settings ──────────────────────────────────────────────────────────────────
class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'name'                   => 'required|string|max:150',
            'tagline'                => 'nullable|string|max:255',
            'phone'                  => 'nullable|string|max:20',
            'email'                  => 'nullable|email|max:150',
            'address'                => 'nullable|string|max:300',
            'primary_color'          => 'required|string|regex:/^#[0-9a-fA-F]{6}$/',
            'secondary_color'        => 'required|string|regex:/^#[0-9a-fA-F]{6}$/',
            'charge_portal_fee'      => 'boolean',
            'portal_maintenance_fee' => 'nullable|numeric|min:0',
        ];
    }
}
