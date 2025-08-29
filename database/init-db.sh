#!/bin/bash
set -e

echo "🚀 PostgreSQL 데이터베이스 초기화 시작..."

# 데이터베이스가 준비될 때까지 대기
until pg_isready -U postgres -d anonymous_email; do
  echo "⏳ 데이터베이스 준비 대기 중..."
  sleep 2
done

echo "✅ 데이터베이스 준비 완료"

# 스키마 실행
psql -U postgres -d anonymous_email -f /docker-entrypoint-initdb.d/01-schema.sql

echo "✅ 스키마 생성 완료"

# 기본 데이터 삽입 (테스트용)
psql -U postgres -d anonymous_email <<-EOSQL
  -- 기존 테스트 데이터가 없으면 삽입
  INSERT INTO users (email_address, access_key_hash) 
  SELECT 'test@nosignup.kr', '\$2a\$10\$example.hash.here'
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE email_address = 'test@nosignup.kr');
  
  -- 테이블 정보 확인
  \dt
EOSQL

echo "✅ 기본 데이터 삽입 완료"
echo "🎉 데이터베이스 초기화 완료!"
