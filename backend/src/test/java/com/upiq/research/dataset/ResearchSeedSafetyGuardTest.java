package com.upiq.research.dataset;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.upiq.research.config.ResearchSeedingProperties;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ResearchSeedSafetyGuardTest {

    @Test
    void doesNotLogTheDatasourceUrlOrCredentialQueryParameters() throws Exception {
        String credentialMarker = "synthetic-test-credential-marker";
        ResearchSeedingProperties properties = new ResearchSeedingProperties();
        properties.setEnabled(true);
        properties.setRequireResearchProfile(true);
        properties.setUserPassword("synthetic-research-password");
        properties.setBlockedDatasourceSubstrings(List.of("neon.tech", "neon.database", "upiq-prod"));

        Environment environment = mock(Environment.class);
        when(environment.getActiveProfiles()).thenReturn(new String[] { "research" });

        DatabaseMetaData metadata = mock(DatabaseMetaData.class);
        when(metadata.getURL()).thenReturn("jdbc:postgresql://localhost/research?user=test&password=" + credentialMarker);
        Connection connection = mock(Connection.class);
        when(connection.getMetaData()).thenReturn(metadata);
        DataSource dataSource = mock(DataSource.class);
        when(dataSource.getConnection()).thenReturn(connection);

        Logger logger = (Logger) LoggerFactory.getLogger(ResearchSeedSafetyGuard.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            new ResearchSeedSafetyGuard(properties, environment, dataSource).assertSafeToSeed();
            String logs = appender.list.stream().map(ILoggingEvent::getFormattedMessage)
                    .reduce("", (left, right) -> left + " " + right);
            assertFalse(logs.contains(credentialMarker));
            assertFalse(logs.contains("jdbc:postgresql://"));
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }
}
