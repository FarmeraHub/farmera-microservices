// use chrono::{DateTime, FixedOffset, NaiveTime};
// use serde::{Deserialize, Serialize};
// use sqlx::postgres::{PgHasArrayType, PgTypeInfo};
// use utoipa::ToSchema;

// #[derive(Debug, ToSchema, Deserialize, Serialize)]
// pub struct TimeWithZone {
//     time: NaiveTime,
//     offset: FixedOffset,
// }

// impl sqlx::Type<sqlx::Postgres> for TimeWithZone {
//     fn type_info() -> <sqlx::Postgres as sqlx::Database>::TypeInfo {
//         PgTypeInfo::with_name("time with time zone")
//     }

//     fn compatible(ty: &<sqlx::Postgres as sqlx::Database>::TypeInfo) -> bool {
//         *ty == Self::type_info()
//     }
// }

// impl<'r> sqlx::Decode<'r, sqlx::Postgres> for TimeWithZone {
//     fn decode(value: sqlx::postgres::PgValueRef<'r>) -> Result<Self, sqlx::error::BoxDynError> {
//         let time_str = value.as_str()?;
//         let (time, offset) = TimeWithZone::parse_timez(time_str)?;
//         Ok(TimeWithZone { time, offset })
//     }
// }

// impl TimeWithZone {
//     pub fn parse_timez(
//         time_str: &str,
//     ) -> Result<(NaiveTime, FixedOffset), sqlx::error::BoxDynError> {
//         let fake_date = "2000-01-01T";
//         let dt = DateTime::parse_from_rfc3339(&format!("{}{}", fake_date, time_str))
//             .map_err(|_| sqlx::error::BoxDynError::from("Invalid time with zone format"))?;
//         Ok((dt.time(), dt.offset().to_owned()))
//     }
// }

// impl PgHasArrayType for TimeWithZone {
//     fn array_type_info() -> PgTypeInfo {
//         PgTypeInfo::with_name("_time with time zone")
//     }
// }
