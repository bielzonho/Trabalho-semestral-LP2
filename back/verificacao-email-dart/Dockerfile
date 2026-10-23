# ---- build stage ----
FROM dart:stable AS build
WORKDIR /app

COPY pubspec.* ./
RUN dart pub get

COPY bin ./bin
COPY lib ./lib
RUN dart pub get --offline
RUN dart compile exe bin/server.dart -o bin/server

# ---- runtime stage ----
# /runtime/ já traz as bibliotecas mínimas e os certificados CA (HTTPS do Supabase/SMTP)
FROM scratch
COPY --from=build /runtime/ /
COPY --from=build /app/bin/server /app/bin/server

ENV PORT=3016
EXPOSE 3016
CMD ["/app/bin/server"]
