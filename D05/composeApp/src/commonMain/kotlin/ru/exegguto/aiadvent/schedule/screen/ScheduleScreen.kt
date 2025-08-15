package ru.exegguto.aiadvent.schedule.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.SignalCellular4Bar
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.BatteryFull
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.exegguto.aiadvent.schedule.data.Lesson
import ru.exegguto.aiadvent.schedule.data.LessonDetails

@Composable
fun ScheduleScreen() {
    val viewModel = rememberScheduleViewModel()
    val lessons = viewModel.lessons

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 100.dp)
        ) {
            item {
                StatusBar()
                Header()
                AvatarRow()
                CalendarRow()
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            items(lessons) { lesson ->
                LessonCard(lesson = lesson)
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
        
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
        ) {
            BottomNavigation()
        }
    }
}

@Composable
private fun StatusBar() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "9:41",
            fontSize = 17.sp,
            fontWeight = FontWeight.SemiBold
        )
        
        Row(
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.SignalCellular4Bar,
                contentDescription = "Cellular",
                modifier = Modifier.size(20.dp)
            )
            Icon(
                imageVector = Icons.Default.Wifi,
                contentDescription = "WiFi",
                modifier = Modifier.size(20.dp)
            )
            Icon(
                imageVector = Icons.Default.BatteryFull,
                contentDescription = "Battery",
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
private fun Header() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(
                        color = Color(0xFFCD2415),
                        shape = RoundedCornerShape(8.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "ЛЗ",
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Text(
                text = "Лига знаний",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1E1E1E)
            )
        }
        
        Icon(
            imageVector = Icons.Default.Menu,
            contentDescription = "Menu",
            modifier = Modifier.size(24.dp)
        )
    }
}

@Composable
private fun AvatarRow() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        repeat(5) { index ->
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .border(
                        width = 1.dp,
                        color = if (index < 3) Color(0xFFCD2415) else Color.Transparent,
                        shape = RoundedCornerShape(16.dp)
                    )
                    .background(
                        color = Color(0xFFF1F1F1),
                        shape = RoundedCornerShape(16.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "👤",
                    fontSize = 24.sp
                )
            }
        }
    }
}

@Composable
private fun CalendarRow() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            val days = listOf(
                "14" to "Пн",
                "15" to "Вт",
                "16" to "Ср",
                "17" to "Чт",
                "18" to "Пт",
                "19" to "Сб",
                "20" to "Вс"
            )
            
            items(days) { (day, weekDay) ->
                val isSelected = day == "15"
                Box(
                    modifier = Modifier
                        .size(46.dp, 52.dp)
                        .border(
                            width = if (isSelected) 1.dp else 0.dp,
                            color = if (isSelected) Color(0xFFCD2415) else Color.Transparent,
                            shape = RoundedCornerShape(12.dp)
                        )
                        .background(
                            color = if (isSelected) Color.White else Color.Transparent,
                            shape = RoundedCornerShape(12.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = day,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF1E1E1E)
                        )
                        Text(
                            text = weekDay,
                            fontSize = 11.sp,
                            color = Color(0xFF858585)
                        )
                    }
                }
            }
        }
        
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(
                    color = Color(0xFFE5E5E5),
                    shape = RoundedCornerShape(12.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.MoreVert,
                contentDescription = "More",
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
private fun LessonCard(lesson: Lesson) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.Top
            ) {
                // Time block
                Box(
                    modifier = Modifier
                        .size(68.dp, 68.dp)
                        .background(
                            color = Color(0xFFF1F1F1),
                            shape = RoundedCornerShape(12.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "${lesson.number} урок",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF1E1E1E)
                        )
                        Text(
                            text = lesson.time,
                            fontSize = 11.sp,
                            color = Color(0xFF858585)
                        )
                    }
                }
                
                // Lesson info
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = lesson.name,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF1E1E1E)
                        )
                        
                        lesson.grade?.let { grade ->
                            Text(
                                text = grade.toString(),
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Medium,
                                color = when (grade) {
                                    5 -> Color(0xFF00A753)
                                    4 -> Color(0xFF00A753)
                                    3 -> Color(0xFFE4A215)
                                    else -> Color(0xFFCD2415)
                                }
                            )
                        }
                    }
                    
                    Text(
                        text = lesson.homework,
                        fontSize = 13.sp,
                        color = Color(0xFF858585)
                    )
                }
            }
            
            // Lesson details
            lesson.details?.let { details ->
                Spacer(modifier = Modifier.height(16.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            color = Color(0xFFF8F8F8),
                            shape = RoundedCornerShape(12.dp)
                        )
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    DetailRow("Д/З:", details.homework, details.homeworkComment)
                    DetailRow("Тема:", details.topic)
                    DetailRow("Работа на уроке:", null, grade = details.classwork)
                    DetailRow("Поведение:", null, grade = details.behavior)
                    DetailRow("Контрольная:", null, grade = details.test)
                }
            }
        }
    }
}

@Composable
private fun DetailRow(
    label: String,
    text: String? = null,
    comment: String? = null,
    grade: Int? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFF1E1E1E),
            modifier = Modifier.width(86.dp)
        )
        
        if (text != null) {
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = text,
                    fontSize = 13.sp,
                    color = Color(0xFF1E1E1E)
                )
                comment?.let {
                    Text(
                        text = it,
                        fontSize = 11.sp,
                        color = Color(0xFF858585)
                    )
                }
            }
        }
        
        grade?.let { g ->
            Text(
                text = g.toString(),
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                color = when (g) {
                    5 -> Color(0xFF00A753)
                    4 -> Color(0xFF00A753)
                    3 -> Color(0xFFE4A215)
                    else -> Color(0xFFCD2415)
                }
            )
        }
    }
}

@Composable
private fun BottomNavigation() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(96.dp)
            .background(
                color = Color(0xFFCD2415),
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
            )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            NavigationItem(
                icon = Icons.Default.Book,
                label = "Дневник",
                isSelected = true
            )
            NavigationItem(
                icon = Icons.Default.Person,
                label = "Обучение",
                isSelected = false
            )
            NavigationItem(
                icon = Icons.Default.Description,
                label = "Отметки",
                isSelected = false
            )
        }
    }
}

@Composable
private fun NavigationItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    isSelected: Boolean
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            modifier = Modifier.size(24.dp),
            tint = if (isSelected) Color.White else Color.White.copy(alpha = 0.6f)
        )
        Text(
            text = label,
            fontSize = 13.sp,
            color = if (isSelected) Color.White else Color.White.copy(alpha = 0.6f),
            textAlign = TextAlign.Center
        )
    }
}
