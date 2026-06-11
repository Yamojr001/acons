<?php
namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\{ClassRoom, Student, Tenant};
use Illuminate\Http\Request;
use Inertia\{Inertia, Response};

class PromotionController extends Controller
{
    public function index(): Response
    {
        $classrooms = ClassRoom::withCount('students')->orderBy('section')->orderBy('level')->get();
        return Inertia::render('SchoolAdmin/Promotion/Index', [
            'classrooms' => $classrooms
        ]);
    }

    public function show(ClassRoom $classroom): Response
    {
        $students = Student::where('class_room_id', $classroom->id)
            ->with('user')
            ->get();

        $allClasses = ClassRoom::orderBy('section')->orderBy('level')->get();

        return Inertia::render('SchoolAdmin/Promotion/Class', [
            'classroom' => $classroom,
            'students'  => $students,
            'allClasses'=> $allClasses,
        ]);
    }

    public function promote(Request $request)
    {
        $request->validate([
            'promotions'               => 'required|array',
            'promotions.*.student_id'  => 'required|exists:students,id',
            'promotions.*.next_class_id' => 'required|exists:class_rooms,id',
            'promotions.*.status'      => 'required|in:promote,repeat,graduate',
        ]);

        foreach ($request->promotions as $promo) {
            $student = Student::find($promo['student_id']);
            if ($promo['status'] === 'promote' || $promo['status'] === 'repeat') {
                $student->update(['class_room_id' => $promo['next_class_id']]);
            } elseif ($promo['status'] === 'graduate') {
                $student->update(['status' => 'graduated', 'class_room_id' => null]);
            }
        }

        return redirect()->route('admin.promotion.index')->with('success', count($request->promotions) . ' students processed successfully.');
    }
}
