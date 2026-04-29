from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="myPosSystem AI Service", version="1.0.0")


class ForecastRequest(BaseModel):
    tenant_id: str
    product_id: str
    days: int = 7


@app.get("/health")
def health():
    return {"success": True, "service": "ai-fastapi"}


@app.post("/forecast/demand")
def demand_forecast(payload: ForecastRequest):
    # Placeholder forecast: replace with trained model integration.
    series = [max(1, 5 + i) for i in range(payload.days)]
    return {
        "success": True,
        "tenantId": payload.tenant_id,
        "productId": payload.product_id,
        "forecastDays": payload.days,
        "predictions": series,
    }
