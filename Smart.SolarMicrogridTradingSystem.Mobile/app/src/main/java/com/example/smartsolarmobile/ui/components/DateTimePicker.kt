package com.example.smartsolarmobile.ui.components

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import java.util.Calendar
import java.util.Date

/**
 * Chains a native DatePickerDialog + TimePickerDialog into one "pick a date & time" action,
 * constrained to [minDate, maxDate] - used for the 7-day energy-slot booking window.
 * Returns a launch() function; call it to start the picker chain.
 */
@Composable
fun rememberDateTimePickerLauncher(
    minDate: Date = Date(),
    maxDate: Date = Date(System.currentTimeMillis() + 7L * 24 * 60 * 60 * 1000),
    onCancelled: () -> Unit = {},
    onPicked: (Date) -> Unit
): () -> Unit {
    val context = LocalContext.current

    return {
        val cal = Calendar.getInstance()
        val year = cal.get(Calendar.YEAR)
        val month = cal.get(Calendar.MONTH)
        val day = cal.get(Calendar.DAY_OF_MONTH)
        var dateConfirmed = false

        val datePicker = DatePickerDialog(
            context,
            { _, pickedYear, pickedMonth, pickedDay ->
                dateConfirmed = true
                val timeCal = Calendar.getInstance()
                var timeConfirmed = false
                val timePicker = TimePickerDialog(
                    context,
                    { _, hour, minute ->
                        timeConfirmed = true
                        val result = Calendar.getInstance().apply {
                            set(pickedYear, pickedMonth, pickedDay, hour, minute, 0)
                            set(Calendar.MILLISECOND, 0)
                        }
                        onPicked(result.time)
                    },
                    timeCal.get(Calendar.HOUR_OF_DAY),
                    timeCal.get(Calendar.MINUTE),
                    false
                )
                timePicker.setOnCancelListener { if (!timeConfirmed) onCancelled() }
                timePicker.show()
            },
            year, month, day
        )
        datePicker.datePicker.minDate = minDate.time
        datePicker.datePicker.maxDate = maxDate.time
        datePicker.setOnCancelListener { if (!dateConfirmed) onCancelled() }
        datePicker.show()
    }
}
