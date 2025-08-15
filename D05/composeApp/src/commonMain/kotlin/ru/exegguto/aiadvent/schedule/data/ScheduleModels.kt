package ru.exegguto.aiadvent.schedule.data

import kotlinx.serialization.Serializable

@Serializable
data class Lesson(
    val id: String,
    val number: Int,
    val name: String,
    val time: String,
    val homework: String,
    val grade: Int? = null,
    val details: LessonDetails? = null
)

@Serializable
data class LessonDetails(
    val homework: String,
    val homeworkComment: String?,
    val topic: String,
    val classwork: Int,
    val behavior: Int,
    val test: Int
)

@Serializable
data class DaySchedule(
    val date: String,
    val dayOfWeek: String,
    val lessons: List<Lesson>
)

@Serializable
data class WeekSchedule(
    val days: List<DaySchedule>
)
