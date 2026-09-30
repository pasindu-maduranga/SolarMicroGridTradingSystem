package com.example.smartsolarmobile.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.smartsolarmobile.R
import java.util.Calendar

// java.time requires API 26+ and this app's minSdk is 24 (no desugaring enabled),
// so java.util.Calendar is used instead to stay compatible with older devices.
private fun currentHour(): Int = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)

private fun currentGreeting(): String {
    val hour = currentHour()
    return when {
        hour < 12 -> "Good morning"
        hour < 18 -> "Good afternoon"
        hour < 22 -> "Good evening"
        else -> "Good night"
    }
}

private fun currentBackgroundRes(): Int {
    val hour = currentHour()
    return when {
        hour in 5..11 -> R.drawable.bg_morning
        hour in 12..16 -> R.drawable.bg_noon
        hour in 17..19 -> R.drawable.bg_evening
        else -> R.drawable.bg_night
    }
}

/** Time-of-day photo hero banner matching the web Dashboard's GreetingHero — greets the
 *  signed-in user by name and shows their role/NIC subtitle, with a logout action. */
@Composable
fun GreetingHero(
    displayName: String,
    subtitle: String,
    onLogout: () -> Unit,
    onProfileClick: (() -> Unit)? = null
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .clip(CurvedBottomShape())
    ) {
        Image(
            painter = painterResource(id = currentBackgroundRes()),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x99102A1A))
        )

        // Interactive/legible content lives in its own status-bar-aware layer so the logout
        // icon never sits under the (edge-to-edge) status bar where it's hard to see or tap —
        // the background image above stays full-bleed.
        Box(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // A Prosumer's sign-out lives inside the Edit Profile drawer instead, so the hero
            // only shows the profile icon for them; Grid Operators (no drawer) keep the direct
            // logout icon in that same top-end slot.
            if (onProfileClick != null) {
                IconButton(
                    onClick = onProfileClick,
                    modifier = Modifier.align(Alignment.TopEnd).padding(top = 8.dp, end = 8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.AccountCircle,
                        contentDescription = "Edit Profile",
                        tint = Color.White
                    )
                }
            } else {
                IconButton(
                    onClick = onLogout,
                    modifier = Modifier.align(Alignment.TopEnd).padding(top = 8.dp, end = 8.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                        contentDescription = "Logout",
                        tint = Color.White
                    )
                }
            }

            Column(modifier = Modifier.fillMaxSize().padding(start = 20.dp, top = 22.dp, end = 60.dp)) {
                Text(
                    text = "${currentGreeting()}, $displayName",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(Color.White.copy(alpha = 0.18f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Default.Badge, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                    Spacer(modifier = Modifier.size(6.dp))
                    Text(text = subtitle, fontSize = 12.5.sp, color = Color.White)
                }
            }
        }
    }
}
