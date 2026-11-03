package com.ridenexa.chat;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ChatController {
    private final ChatService chat;

    public ChatController(ChatService chat) {
        this.chat = chat;
    }

    @PostMapping("/chat")
    public Map<String, Object> reply(@Valid @RequestBody ChatDtos.ChatRequest input) {
        return chat.reply(input);
    }
}
