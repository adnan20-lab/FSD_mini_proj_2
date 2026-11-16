package com.example.heatwaveadvisory.engine;

import com.example.heatwaveadvisory.document.RegionDocument;
import com.example.heatwaveadvisory.document.TerrainType;
import com.example.heatwaveadvisory.exception.ConflictException;
import com.example.heatwaveadvisory.repository.MonitoringZoneRepository;
import com.example.heatwaveadvisory.repository.RegionRepository;
import com.example.heatwaveadvisory.service.RegionService;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

class RegionServiceConflictTest {
    @Test
    void preventsDeletingRegionWhenMonitoringZonesAreLinked() {
        RegionDocument region = new RegionDocument();
        region.setId("region-1");
        region.setName("Test Region");
        region.setTerrainType(TerrainType.PLAINS);
        AtomicBoolean deleteCalled = new AtomicBoolean(false);

        RegionRepository regions = proxy(RegionRepository.class, (method, args) -> switch (method.getName()) {
            case "findById" -> Optional.of(region);
            case "delete" -> {
                deleteCalled.set(true);
                yield null;
            }
            default -> defaultValue(method);
        });

        MonitoringZoneRepository zones = proxy(MonitoringZoneRepository.class, (method, args) ->
                method.getName().equals("findByRegionId")
                        ? List.of(new Object())
                        : defaultValue(method));

        RegionService service = new RegionService(regions, zones);
        ConflictException error = assertThrows(ConflictException.class, () -> service.delete("region-1"));
        assertTrue(error.getMessage().contains("monitoring zones"));
        assertFalse(deleteCalled.get(), "Repository delete must not be called for a region with child zones");
    }

    @SuppressWarnings("unchecked")
    private <T> T proxy(Class<T> type, Handler handler) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[]{type},
                (proxy, method, args) -> handler.invoke(method, args));
    }

    private Object defaultValue(Method method) {
        Class<?> returnType = method.getReturnType();
        if (!returnType.isPrimitive()) return null;
        if (returnType == boolean.class) return false;
        if (returnType == int.class) return 0;
        if (returnType == long.class) return 0L;
        if (returnType == double.class) return 0.0;
        if (returnType == float.class) return 0.0f;
        if (returnType == short.class) return (short) 0;
        if (returnType == byte.class) return (byte) 0;
        if (returnType == char.class) return '\0';
        return null;
    }

    @FunctionalInterface
    private interface Handler {
        Object invoke(Method method, Object[] args);
    }
}
