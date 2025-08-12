package ru.exegguto.aiadvent

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform