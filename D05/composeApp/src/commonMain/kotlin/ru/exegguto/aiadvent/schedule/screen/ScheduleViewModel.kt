package ru.exegguto.aiadvent.schedule.screen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import ru.exegguto.aiadvent.schedule.data.Lesson
import ru.exegguto.aiadvent.schedule.data.LessonDetails

class ScheduleViewModel {
    val lessons = listOf(
        Lesson(
            id = "1",
            number = 1,
            name = "Обществознание",
            time = "09:30 - 10:15",
            homework = "Выучить таблицу умножения на 2"
        ),
        Lesson(
            id = "2",
            number = 2,
            name = "Физика",
            time = "09:30 - 10:15",
            homework = "Выучить таблицу умножения на 2",
            grade = 4
        ),
        Lesson(
            id = "3",
            number = 3,
            name = "Алгебра",
            time = "09:30 - 10:15",
            homework = "Выучить таблицу умножения на 2",
            grade = 4,
            details = LessonDetails(
                homework = "Выучить таблицу корней",
                homeworkComment = "Отлично выполнил задание!",
                topic = "Таблица умножения на 3",
                classwork = 5,
                behavior = 2,
                test = 3
            )
        ),
        Lesson(
            id = "4",
            number = 4,
            name = "Русский",
            time = "09:30 - 10:15",
            homework = "Выучить таблицу умножения на 2"
        ),
        Lesson(
            id = "5",
            number = 5,
            name = "Литература",
            time = "09:30 - 10:15",
            homework = "Выучить таблицу умножения на 2",
            grade = 3
        ),
        Lesson(
            id = "6",
            number = 6,
            name = "Геометрия",
            time = "09:30 - 10:15",
            homework = "Выучить таблицу умножения на 2"
        )
    )
}

@Composable
fun rememberScheduleViewModel(): ScheduleViewModel = remember { ScheduleViewModel() }
